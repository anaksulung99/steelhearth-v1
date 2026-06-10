import { apiClient } from "./client.js"
import type { ApiResponse, PaginatedResponse, FingerprintProfile } from "./types.js"

export const fingerprintsApi = {
  list(params?: { page?: number; limit?: number; deviceType?: string; search?: string }) {
    return apiClient.get<PaginatedResponse<FingerprintProfile>>("/api/fingerprints", params)
  },

  get(id: string) {
    return apiClient.get<ApiResponse<FingerprintProfile>>(`/api/fingerprints/${id}`)
  },

  create(dto: Partial<FingerprintProfile>) {
    return apiClient.post<ApiResponse<FingerprintProfile>>("/api/fingerprints", dto)
  },

  update(id: string, dto: Partial<FingerprintProfile>) {
    return apiClient.patch<ApiResponse<FingerprintProfile>>(`/api/fingerprints/${id}`, dto)
  },

  delete(id: string) {
    return apiClient.delete(`/api/fingerprints/${id}`)
  },
}
