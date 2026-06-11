import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..", "..", "..")

function loadEnv(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const raw = fs.readFileSync(filePath, "utf8")
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const idx = trimmed.indexOf("=")
    if (idx <= 0) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnv(path.join(repoRoot, ".env"))
loadEnv(path.join(repoRoot, "apps", "worker", ".env"))

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const config = {
  env: optional("NODE_ENV", "development"),
  isDev: optional("NODE_ENV", "development") !== "production",

  api: {
    url: optional("API_URL", "http://127.0.0.1:3741"),
    token: optional("API_TOKEN", ""),
    internalToken: optional("API_INTERNAL_TOKEN", ""),
  },

  redis: {
    host: optional("REDIS_HOST", "127.0.0.1"),
    port: parseInt(optional("REDIS_PORT", "6379"), 10),
    user: optional("REDIS_USER", ""),
    password: optional("REDIS_PASSWORD", ""),
    db: parseInt(optional("REDIS_DB", "0"), 10),
    tlsRootCa: optional("REDIS_ROOT_CA", ""),
    tlsCert: optional("REDIS_CERT", ""),
    tlsKey: optional("REDIS_KEY", ""),
    tlsServername: optional("REDIS_TLS_SERVERNAME", ""),
  },

  worker: {
    id: optional("WORKER_ID", "worker-01"),
    maxConcurrent: parseInt(optional("MAX_CONCURRENT", "3"), 10),
    heartbeatInterval: parseInt(optional("HEARTBEAT_INTERVAL", "30000"), 10),
  },

  browser: {
    headless: optional("BROWSER_HEADLESS", "true") !== "false",
    timeout: parseInt(optional("BROWSER_TIMEOUT", "30000"), 10),
    userDataDir: optional("BROWSER_USER_DATA_DIR", ""),
  },
} as const

export type Config = typeof config
