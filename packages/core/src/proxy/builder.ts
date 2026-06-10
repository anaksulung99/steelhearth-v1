import type { PlaywrightProxy, ProxyRow } from "./types.js"

export function formatProxy(proxy: ProxyRow): PlaywrightProxy {
  const scheme = proxy.protocol.toLowerCase()
  const server = `${scheme}://${proxy.host}:${proxy.port}`
  const result: PlaywrightProxy = { server }
  if (proxy.username) result.username = proxy.username
  if (proxy.password) result.password = proxy.password
  return result
}

export type ProxyStrategy = "NONE" | "PER_SESSION" | "ROTATE"

export function pickProxy(
  proxies: ProxyRow[],
  strategy: ProxyStrategy = "PER_SESSION",
): ProxyRow | null {
  if (strategy === "NONE" || proxies.length === 0) return null
  return proxies[Math.floor(Math.random() * proxies.length)] ?? null
}

export type TrafficSource = "DIRECT" | "SEARCH" | "SOCIAL" | "REFERRAL"

export function buildReferrer(
  source: TrafficSource,
  customReferrer: string | null,
  targetUrl: string,
): string | null {
  if (customReferrer) return customReferrer

  switch (source) {
    case "SEARCH": {
      try {
        const hostname = new URL(targetUrl).hostname
        return `https://www.google.com/search?q=${encodeURIComponent(hostname)}`
      } catch {
        return "https://www.google.com/"
      }
    }
    case "SOCIAL":
      return pickRandomOr(
        ["https://www.facebook.com/", "https://twitter.com/", "https://www.instagram.com/"],
        "https://www.facebook.com/",
      )
    case "REFERRAL":
      return null
    case "DIRECT":
    default:
      return null
  }
}

function pickRandomOr<T>(arr: T[], fallback: T): T {
  return arr.length === 0 ? fallback : (arr[Math.floor(Math.random() * arr.length)] as T)
}
