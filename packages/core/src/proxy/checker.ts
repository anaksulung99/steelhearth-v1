import * as http from "node:http"
import * as https from "node:https"
import { HttpProxyAgent } from "http-proxy-agent"
import { HttpsProxyAgent } from "https-proxy-agent"
import { SocksProxyAgent } from "socks-proxy-agent"
import type { ProxyRow } from "./types.js"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProxyCheckResult {
  alive: boolean
  latency: number | null
  ip: string | null
  country: string | null
  countryCode: string | null
  error?: string
}

export interface CheckOptions {
  /** Request timeout in ms. Default: 10_000 */
  timeout?: number
  /**
   * URL to fetch through the proxy.
   * Must return JSON with ip/country info.
   * Default: http://ip-api.com/json/?fields=status,country,countryCode,query
   */
  testUrl?: string
}

export interface BatchCheckOptions extends CheckOptions {
  /** Max simultaneous checks. Default: 10 */
  concurrency?: number
}

// ─── Agent builder ────────────────────────────────────────────────────────────

function buildProxyUrl(proxy: ProxyRow): string {
  const proto = proxy.protocol.toLowerCase()
  const creds = proxy.username && proxy.password
    ? `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@`
    : ""
  return `${proto}://${creds}${proxy.host}:${proxy.port}`
}

function buildAgent(proxy: ProxyRow, isHttps: boolean): http.Agent {
  const proxyUrl = buildProxyUrl(proxy)
  const proto = proxy.protocol.toLowerCase()

  if (proto.startsWith("socks")) {
    return new SocksProxyAgent(proxyUrl) as unknown as http.Agent
  }
  if (isHttps) {
    return new HttpsProxyAgent(proxyUrl) as unknown as http.Agent
  }
  return new HttpProxyAgent(proxyUrl)
}

// ─── Response parser ──────────────────────────────────────────────────────────

interface IpApiResponse {
  status?: string
  country?: string
  countryCode?: string
  query?: string
  // httpbin / ipify variants
  origin?: string
  ip?: string
}

function parseIpResponse(body: string): Pick<ProxyCheckResult, "ip" | "country" | "countryCode"> {
  try {
    const json = JSON.parse(body) as IpApiResponse
    return {
      ip: json.query ?? json.ip ?? json.origin?.split(",")[0]?.trim() ?? null,
      country: json.country ?? null,
      countryCode: json.countryCode ?? null,
    }
  } catch {
    return { ip: null, country: null, countryCode: null }
  }
}

// ─── Single proxy check ───────────────────────────────────────────────────────

const DEFAULT_TEST_URL = "http://ip-api.com/json/?fields=status,country,countryCode,query"

export function checkProxy(proxy: ProxyRow, opts: CheckOptions = {}): Promise<ProxyCheckResult> {
  const timeout = opts.timeout ?? 10_000
  const testUrl = opts.testUrl ?? DEFAULT_TEST_URL

  return new Promise((resolve) => {
    let settled = false
    const settle = (result: ProxyCheckResult) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }

    const url = new URL(testUrl)
    const isHttps = url.protocol === "https:"
    const port = url.port ? parseInt(url.port) : isHttps ? 443 : 80
    const transport = isHttps ? https : http

    const timer = setTimeout(() => {
      req.destroy()
      settle({ alive: false, latency: null, ip: null, country: null, countryCode: null, error: "timeout" })
    }, timeout)

    const start = Date.now()

    const req = transport.request(
      {
        method: "GET",
        hostname: url.hostname,
        port,
        path: url.pathname + url.search,
        agent: buildAgent(proxy, isHttps),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ProxyChecker/1.0)",
          Accept: "application/json",
          Connection: "close",
        },
      },
      (res) => {
        let body = ""
        res.on("data", (chunk: Buffer) => {
          body += chunk.toString()
          if (body.length > 4096) {
            // Guard against giant responses
            res.destroy()
          }
        })
        res.on("end", () => {
          const latency = Date.now() - start
          settle({ alive: true, latency, ...parseIpResponse(body) })
        })
        res.on("error", (err) => {
          settle({ alive: false, latency: null, ip: null, country: null, countryCode: null, error: err.message })
        })
      },
    )

    req.on("error", (err) => {
      settle({ alive: false, latency: null, ip: null, country: null, countryCode: null, error: err.message })
    })

    req.end()
  })
}

// ─── Batch check ─────────────────────────────────────────────────────────────

export async function checkProxies(
  proxies: ProxyRow[],
  opts: BatchCheckOptions = {},
  onResult?: (id: string, result: ProxyCheckResult) => void,
): Promise<Map<string, ProxyCheckResult>> {
  const { concurrency = 10, ...checkOpts } = opts
  const results = new Map<string, ProxyCheckResult>()

  for (let i = 0; i < proxies.length; i += concurrency) {
    const batch = proxies.slice(i, i + concurrency)
    await Promise.all(
      batch.map(async (proxy) => {
        const result = await checkProxy(proxy, checkOpts)
        results.set(proxy.id, result)
        onResult?.(proxy.id, result)
      }),
    )
  }

  return results
}

// ─── Status resolver ──────────────────────────────────────────────────────────

/**
 * Maps a check result to a Prisma ProxyStatus enum value.
 * ACTIVE   — alive and latency ≤ 2000ms
 * SLOW     — alive but latency > 2000ms
 * DEAD     — not alive
 */
export function resolveProxyStatus(result: ProxyCheckResult): "ACTIVE" | "SLOW" | "DEAD" {
  if (!result.alive) return "DEAD"
  if (result.latency !== null && result.latency > 2000) return "SLOW"
  return "ACTIVE"
}
