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
