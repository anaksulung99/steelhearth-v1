export interface PlaywrightProxy {
  server: string
  username?: string
  password?: string
  bypass?: string
}

export interface ProxyRow {
  id: string
  protocol: string
  host: string
  port: number
  username: string | null
  password: string | null
}

export function formatProxy(proxy: ProxyRow): PlaywrightProxy {
  const scheme = proxy.protocol.toLowerCase().replace("socks4", "socks4").replace("socks5", "socks5")
  const server = `${scheme}://${proxy.host}:${proxy.port}`
  const result: PlaywrightProxy = { server }
  if (proxy.username) result.username = proxy.username
  if (proxy.password) result.password = proxy.password
  return result
}

export function pickProxy(
  proxies: ProxyRow[],
  strategy: "NONE" | "PER_SESSION" | "PER_CLICK",
  current?: ProxyRow
): ProxyRow | null {
  if (strategy === "NONE" || proxies.length === 0) return null
  if (strategy === "PER_SESSION" && current) return current
  // Pick a random proxy
  return proxies[Math.floor(Math.random() * proxies.length)] ?? null
}

export function buildReferrer(
  source: string,
  referrerUrl: string | null,
  targetUrl: string
): string | null {
  if (referrerUrl) return referrerUrl
  switch (source) {
    case "SEARCH":
      return `https://www.google.com/search?q=${encodeURIComponent(new URL(targetUrl).hostname)}`
    case "SOCIAL":
      return "https://www.facebook.com/"
    case "REFERRAL":
      return null
    case "DIRECT":
    default:
      return null
  }
}
