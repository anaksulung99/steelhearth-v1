import { apiClient } from "./client.js"
import type { ApiResponse, PaginatedResponse, WorkerNode } from "./types.js"

export const workersApi = {
  list(params?: { page?: number; limit?: number; status?: string }) {
    return apiClient.get<PaginatedResponse<WorkerNode>>("/api/workers", params)
  },

  health() {
    return apiClient.get<ApiResponse<{ workers: WorkerNode[]; totalActive: number }>>("/api/workers/health")
  },
}
