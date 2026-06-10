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
loadEnv(path.join(repoRoot, "apps", "api", ".env"))

function required(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing required env var: ${key}`)
  return val
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const config = {
  env: optional("NODE_ENV", "development"),
  isDev: optional("NODE_ENV", "development") !== "production",

  api: {
    host: optional("API_HOST", "127.0.0.1"),
    port: parseInt(optional("API_PORT", "3741"), 10),
  },

  db: {
    url: required("DATABASE_URL"),
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
    maxConcurrent: parseInt(optional("MAX_CONCURRENT", "5"), 10),
  },

  log: {
    level: optional("LOG_LEVEL", "info") as "debug" | "info" | "warn" | "error",
  },
} as const

export type Config = typeof config
