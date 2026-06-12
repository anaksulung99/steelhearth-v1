import { app } from 'electron'
import { fork, spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'

const REDIS_PORT = 16379
const API_PORT = 3741

let redisProc: ChildProcess | null = null
let apiProc: ChildProcess | null = null
let workerProc: ChildProcess | null = null
let apiExited = false
let workerExited = false

function sidecarLogFile(): string {
  return path.join(app.getPath('logs'), 'sidecar.log')
}

function logSidecar(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`
  try {
    fs.mkdirSync(path.dirname(sidecarLogFile()), { recursive: true })
    fs.appendFileSync(sidecarLogFile(), line)
  } catch {
    // Logging must never block sidecar startup.
  }
  console.log(message)
}

function logSidecarChunk(prefix: string, chunk: Buffer | string) {
  const text = chunk.toString()
  for (const line of text.split(/\r?\n/)) {
    if (line.trim()) logSidecar(`${prefix} ${line}`)
  }
}

function sidecarPath(name: string): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'sidecar', name)
    : path.join(app.getAppPath(), 'resources', 'sidecar', name)
}

function redisBinPath(): string {
  const platform = process.platform as 'win32' | 'darwin' | 'linux'
  const bin = platform === 'win32' ? 'redis-server.exe' : 'redis-server'
  return app.isPackaged
    ? path.join(process.resourcesPath, 'redis', platform, bin)
    : path.join(app.getAppPath(), 'resources', 'redis', platform, bin)
}

function fixDatabaseUrl(url: string): string {
  return url
    .replace(/[?&]sslrootcert=[^&]*/g, '')
    .replace(/[?&]sslkey=[^&]*/g, '')
    .replace(/[?&]sslcert=[^&]*/g, '')
}

function sidecarEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) env[key] = value
  }

  env.API_HOST = '127.0.0.1'
  env.API_PORT = String(API_PORT)
  env.API_URL = `http://127.0.0.1:${API_PORT}`
  env.REDIS_HOST = '127.0.0.1'
  env.REDIS_PORT = String(REDIS_PORT)
  env.REDIS_USER = ''
  env.REDIS_PASSWORD = ''
  env.REDIS_ROOT_CA = ''
  env.REDIS_CERT = ''
  env.REDIS_KEY = ''
  env.NODE_ENV = 'production'
  env.ELECTRON_RUN_AS_NODE = '1'
  env.PLAYWRIGHT_BROWSERS_PATH = path.join(app.getPath('userData'), 'browsers')

  if (env.DATABASE_URL) {
    env.DATABASE_URL = fixDatabaseUrl(env.DATABASE_URL)
  }

  return env
}

function forkNodeSidecar(name: 'api' | 'worker', entry: string, env: Record<string, string>): ChildProcess {
  const child = fork(entry, [], {
    cwd: path.dirname(entry),
    env,
    execPath: process.execPath,
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    windowsHide: true,
  })

  child.stdout?.on('data', (chunk: Buffer) => logSidecarChunk(`[${name}]`, chunk))
  child.stderr?.on('data', (chunk: Buffer) => logSidecarChunk(`[${name}/err]`, chunk))
  child.on('error', (error) => logSidecar(`[sidecar/${name}] Error: ${error.message}`))
  child.on('exit', (code, signal) => {
    if (name === 'api') apiExited = true
    else workerExited = true
    logSidecar(`[sidecar/${name}] Exited with code ${code ?? 'null'} signal ${signal ?? 'null'}`)
  })

  return child
}

function waitForPort(port: number, timeout = 25_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout
    const attempt = () => {
      const socket = net.createConnection(port, '127.0.0.1')
      socket.once('connect', () => {
        socket.destroy()
        resolve()
      })
      socket.once('error', () => {
        socket.destroy()
        if (Date.now() >= deadline) {
          reject(new Error(`Port ${port} did not become ready within ${timeout}ms`))
        } else {
          setTimeout(attempt, 400)
        }
      })
    }
    attempt()
  })
}

function isPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection(port, '127.0.0.1')
    const done = (value: boolean) => {
      socket.destroy()
      resolve(value)
    }
    socket.once('connect', () => done(true))
    socket.once('error', () => done(false))
    setTimeout(() => done(false), 1000)
  })
}

export async function startSidecars(): Promise<void> {
  if (!app.isPackaged) {
    logSidecar('[sidecar] Dev mode - API and Worker run externally')
    return
  }

  apiExited = false
  workerExited = false
  logSidecar(`[sidecar] Starting from resourcesPath=${process.resourcesPath}`)

  const redisBin = redisBinPath()
  if (!fs.existsSync(redisBin)) {
    throw new Error(`Redis binary not found at: ${redisBin}`)
  }

  redisProc = spawn(redisBin, [
    '--port', String(REDIS_PORT),
    '--save', '',
    '--loglevel', 'warning',
    '--bind', '127.0.0.1',
  ], { windowsHide: true })

  redisProc.stdout?.on('data', (chunk: Buffer) => logSidecarChunk('[redis]', chunk))
  redisProc.stderr?.on('data', (chunk: Buffer) => logSidecarChunk('[redis/err]', chunk))
  redisProc.on('error', (error) => logSidecar(`[sidecar/redis] Error: ${error.message}`))
  redisProc.on('exit', (code, signal) => {
    logSidecar(`[sidecar/redis] Exited with code ${code ?? 'null'} signal ${signal ?? 'null'}`)
  })

  await waitForPort(REDIS_PORT)
  logSidecar(`[sidecar] Redis ready on :${REDIS_PORT}`)

  const env = sidecarEnv()
  logSidecar(`[sidecar] API_PORT=${env.API_PORT} API_URL=${env.API_URL} REDIS_PORT=${env.REDIS_PORT}`)

  const apiEntry = sidecarPath('api.cjs')
  if (!fs.existsSync(apiEntry)) throw new Error(`API bundle not found: ${apiEntry}`)

  logSidecar(`[sidecar] Forking API: ${apiEntry}`)
  apiProc = forkNodeSidecar('api', apiEntry, env)

  await waitForPort(API_PORT)
  logSidecar(`[sidecar] API ready on :${API_PORT}`)

  const workerEntry = sidecarPath('worker.cjs')
  if (!fs.existsSync(workerEntry)) throw new Error(`Worker bundle not found: ${workerEntry}`)

  logSidecar(`[sidecar] Forking Worker: ${workerEntry}`)
  workerProc = forkNodeSidecar('worker', workerEntry, env)
  logSidecar('[sidecar] Worker started')
}

export async function stopSidecars(): Promise<void> {
  workerProc?.kill()
  apiProc?.kill()
  await new Promise<void>((resolve) => setTimeout(resolve, 1500))
  redisProc?.kill('SIGTERM')
  redisProc = null
  apiProc = null
  workerProc = null
  apiExited = false
  workerExited = false
}

export async function getSidecarStatus() {
  const [redisOk, apiOk] = await Promise.all([
    isPortOpen(REDIS_PORT),
    isPortOpen(API_PORT),
  ])
  const workerAlive = workerProc !== null && !workerExited && redisOk
  return { redis: redisOk, api: apiOk && !apiExited, worker: workerAlive }
}
