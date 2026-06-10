import { apiClient } from "./client.js"
import type { ApiResponse, PaginatedResponse, User, CreateUserWithLicenseDto, UpdateUserDto } from "./types.js"

export const userApi = {
  list(params?: { page?: number; limit?: number; role?: string; search?: string }) {
    return apiClient.get<PaginatedResponse<User>>("/api/users", params)
  },

  get(id: string) {
    return apiClient.get<ApiResponse<User>>(`/api/users/${id}`)
  },

  getByEmail(email: string) {
    return apiClient.get<ApiResponse<User>>(`/api/users/find/${email}`)
  },

  getByLicense(license: string) {
    return apiClient.get<ApiResponse<User>>(`/api/users/license/${license}`)
  },

  create(dto: CreateUserWithLicenseDto) {
    return apiClient.post<ApiResponse<User>>(`/api/users`, dto)
  },

  update(id: string, dto: UpdateUserDto) {
    return apiClient.put<ApiResponse<User>>(`/api/users/${id}`, dto)
  },

  delete(id: string) {
    return apiClient.delete(`/api/users/${id}`)
  },
}