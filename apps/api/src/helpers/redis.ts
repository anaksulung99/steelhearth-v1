import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import type { ConnectionOptions } from "bullmq"
import { config } from "../config.js"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..")

function resolveCert(p: string): Buffer | undefined {
  if (!p) return undefined
  const abs = path.isAbsolute(p) ? p : path.join(repoRoot, p)
  return fs.existsSync(abs) ? fs.readFileSync(abs) : undefined
}

export function buildRedisOpts(): ConnectionOptions {
  const ca = resolveCert(config.redis.tlsRootCa)
  const cert = resolveCert(config.redis.tlsCert)
  const key = resolveCert(config.redis.tlsKey)
  const useTls = !!(ca || cert || key)

  return {
    host: config.redis.host,
    port: config.redis.port,
    username: config.redis.user || undefined,
    password: config.redis.password || undefined,
    db: config.redis.db,
    maxRetriesPerRequest: null,
    ...(useTls
      ? {
          tls: {
            ca: ca ? [ca] : undefined,
            cert,
            key,
            servername: config.redis.tlsServername || config.redis.host,
            rejectUnauthorized: !!ca,
          },
        }
      : {}),
  } as ConnectionOptions
}
