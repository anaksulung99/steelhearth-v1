const DEFAULT_BASE_URL = "http://127.0.0.1:3741"

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

class ApiClient {
  baseUrl: string = DEFAULT_BASE_URL
  token: string | null = null
  licenseAuth: { email: string; licenseKey: string; deviceId: string } | null = null

  private async request<T>(
    method: string,
    path: string,
    opts: { body?: unknown; params?: Record<string, string | number | boolean | undefined> } = {},
  ): Promise<T> {
    console.log(DEFAULT_BASE_URL)
    const url = new URL(`${this.baseUrl}${path}`)
    if (opts.params) {
      for (const [k, v] of Object.entries(opts.params)) {
        if (v !== undefined && v !== null && v !== "") {
          url.searchParams.set(k, String(v))
        }
      }
    }

    const hasBody = opts.body !== undefined
    const headers: Record<string, string> = {}
    if (hasBody) headers["Content-Type"] = "application/json"
    if (this.token) headers["x-api-token"] = this.token
    if (this.licenseAuth) {
      headers["x-license-email"] = this.licenseAuth.email
      headers["x-license-key"] = this.licenseAuth.licenseKey
      headers["x-device-id"] = this.licenseAuth.deviceId
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      ...(hasBody ? { body: JSON.stringify(opts.body) } : {}),
    })

    if (res.status === 204) return undefined as T

    const json = await res.json()

    if (!res.ok) {
      const err = json?.error ?? {}
      throw new ApiError(res.status, err.code ?? "UNKNOWN_ERROR", err.message ?? res.statusText, err.details)
    }

    return json
  }

  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
    return this.request<T>("GET", path, { params })
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, { body })
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>("PUT", path, { body })
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, { body })
  }

  delete(path: string) {
    return this.request<void>("DELETE", path)
  }
}

export const apiClient = new ApiClient()
export { ApiError }
