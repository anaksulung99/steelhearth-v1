import { apiClient } from "./client.js"
import type { ApiResponse, PaginatedResponse, BehaviourProfile, CreateBehaviourDto, UpdateBehaviourDto } from "./types.js"

export const behavioursApi = {
  list(params?: { page?: number; limit?: number; type?: string; search?: string }) {
    return apiClient.get<PaginatedResponse<BehaviourProfile>>("/api/behaviours", params)
  },

  get(id: string) {
    return apiClient.get<ApiResponse<BehaviourProfile>>(`/api/behaviours/${id}`)
  },

  create(dto: CreateBehaviourDto) {
    return apiClient.post<ApiResponse<BehaviourProfile>>("/api/behaviours", dto)
  },

  update(id: string, dto: UpdateBehaviourDto) {
    return apiClient.patch<ApiResponse<BehaviourProfile>>(`/api/behaviours/${id}`, dto)
  },

  delete(id: string) {
    return apiClient.delete(`/api/behaviours/${id}`)
  },
}
