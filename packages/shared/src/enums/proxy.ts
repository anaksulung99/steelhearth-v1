export const ProxyStatus = {
  UNCHECKED: "UNCHECKED",
  ACTIVE: "ACTIVE",
  DEAD: "DEAD",
  SLOW: "SLOW",
  BLOCKED: "BLOCKED",
} as const

export type ProxyStatus = (typeof ProxyStatus)[keyof typeof ProxyStatus]

export const ProxyProtocol = {
  HTTP: "HTTP",
  HTTPS: "HTTPS",
  SOCKS4: "SOCKS4",
  SOCKS5: "SOCKS5",
} as const

export type ProxyProtocol = (typeof ProxyProtocol)[keyof typeof ProxyProtocol]

export const ProxyCategory = {
  RESIDENTIAL: "RESIDENTIAL",
  MOBILE: "MOBILE",
  DATACENTER: "DATACENTER",
  UNKNOWN: "UNKNOWN",
} as const

export type ProxyCategory = (typeof ProxyCategory)[keyof typeof ProxyCategory]
