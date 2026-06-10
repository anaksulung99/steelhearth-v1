import { apiClient } from "./client.js"
import type { ApiResponse, PaginatedResponse, ProxyGroup, Proxy } from "./types.js"

export const proxiesApi = {
  // Groups
  listGroups() {
    return apiClient.get<ApiResponse<ProxyGroup[]>>("/api/proxies/groups")
  },

  getGroup(id: string) {
    return apiClient.get<ApiResponse<ProxyGroup>>(`/api/proxies/groups/${id}`)
  },

  createGroup(dto: { name: string; description?: string }) {
    return apiClient.post<ApiResponse<ProxyGroup>>("/api/proxies/groups", dto)
  },

  updateGroup(id: string, dto: { name?: string; description?: string }) {
    return apiClient.patch<ApiResponse<ProxyGroup>>(`/api/proxies/groups/${id}`, dto)
  },

  deleteGroup(id: string) {
    return apiClient.delete(`/api/proxies/groups/${id}`)
  },

  // Proxies
  list(params?: { page?: number; limit?: number; proxyGroupId?: string; status?: string; search?: string }) {
    return apiClient.get<PaginatedResponse<Proxy>>("/api/proxies", params)
  },

  get(id: string) {
    return apiClient.get<ApiResponse<Proxy>>(`/api/proxies/${id}`)
  },

  bulkImport(dto: { proxyGroupId: string; lines: string; protocol?: string; category?: string }) {
    return apiClient.post<ApiResponse<{ imported: number; skipped: number; failed: number; errors: { line: string; reason: string }[] }>>("/api/proxies/bulk", dto)
  },

  update(id: string, dto: { category?: string; status?: string }) {
    return apiClient.patch<ApiResponse<Proxy>>(`/api/proxies/${id}`, dto)
  },

  delete(id: string) {
    return apiClient.delete(`/api/proxies/${id}`)
  },

  // Proxy checker
  check(id: string, opts?: { timeout?: number; targetUrl?: string }) {
    return apiClient.post<ApiResponse<{ id: string; status: string; alive: boolean; latency: number | null; ip: string | null; country: string | null; countryCode: string | null }>>(`/api/proxies/${id}/check`, opts ?? {})
  },

  checkGroup(groupId: string, opts?: { timeout?: number; concurrency?: number; targetUrl?: string }) {
    return apiClient.post<ApiResponse<{ total: number; results: Record<string, { alive: boolean; latency: number | null; ip: string | null; country: string | null; countryCode: string | null; status: string }> }>>(`/api/proxies/groups/${groupId}/check`, opts ?? {})
  },
}
