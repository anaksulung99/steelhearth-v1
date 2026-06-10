import { apiClient } from "./client.js"
import type { ApiResponse, DashboardStats, CampaignAnalytics } from "./types.js"

export const analyticsApi = {
  dashboard() {
    return apiClient.get<ApiResponse<DashboardStats>>("/api/analytics/dashboard")
  },

  campaign(campaignId: string) {
    return apiClient.get<ApiResponse<CampaignAnalytics>>(`/api/analytics/campaigns/${campaignId}`)
  },
}
