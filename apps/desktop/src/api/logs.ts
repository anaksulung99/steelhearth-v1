import { apiClient } from "./client.js"
import type { PaginatedResponse, SystemLog } from "./types.js"

export const logsApi = {
  list(params?: {
    page?: number
    limit?: number
    level?: string
    category?: string
    campaignId?: string
    sessionId?: string
    search?: string
  }) {
    return apiClient.get<PaginatedResponse<SystemLog>>("/api/logs", params)
  },
}
