import { apiClient } from "./client.js"
import type { ApiResponse, AppSetting } from "./types.js"

export const settingsApi = {
  list() {
    return apiClient.get<ApiResponse<AppSetting[]>>("/api/settings")
  },

  set(key: string, value: string, isSecret?: boolean) {
    return apiClient.put<ApiResponse<AppSetting>>(`/api/settings/${key}`, { value, isSecret })
  },

  bulkSet(settings: { key: string; value: string; isSecret?: boolean }[]) {
    return apiClient.put<ApiResponse<AppSetting[]>>("/api/settings", { settings })
  },

  delete(key: string) {
    return apiClient.delete(`/api/settings/${key}`)
  },
}
