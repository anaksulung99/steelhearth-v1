import { apiClient } from "./client.js"
import type {
  ApiResponse, PaginatedResponse,
  Campaign, CreateCampaignDto, UpdateCampaignDto,
  CampaignClickSelector, CampaignSchedule, BrowserSession,
  CampaignAnalytics,
} from "./types.js"

const BASE = "/api/campaigns"

export const campaignsApi = {
  list(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    return apiClient.get<PaginatedResponse<Campaign>>(BASE, params)
  },

  get(id: string) {
    return apiClient.get<ApiResponse<Campaign>>(`${BASE}/${id}`)
  },

  create(dto: CreateCampaignDto) {
    return apiClient.post<ApiResponse<Campaign>>(BASE, dto)
  },

  update(id: string, dto: UpdateCampaignDto) {
    return apiClient.patch<ApiResponse<Campaign>>(`${BASE}/${id}`, dto)
  },

  delete(id: string) {
    return apiClient.delete(`${BASE}/${id}`)
  },

  start(id: string) {
    return apiClient.post<ApiResponse<Campaign>>(`${BASE}/${id}/start`, {})
  },

  pause(id: string) {
    return apiClient.post<ApiResponse<Campaign>>(`${BASE}/${id}/pause`, {})
  },

  stop(id: string) {
    return apiClient.post<ApiResponse<Campaign>>(`${BASE}/${id}/stop`, {})
  },

  // Click selectors
  getSelectors(id: string) {
    return apiClient.get<ApiResponse<CampaignClickSelector[]>>(`${BASE}/${id}/selectors`)
  },

  addSelector(id: string, dto: { selector: string; selectorType?: string; description?: string; order?: number }) {
    return apiClient.post<ApiResponse<CampaignClickSelector>>(`${BASE}/${id}/selectors`, dto)
  },

  updateSelector(id: string, selectorId: string, dto: Partial<{ selector: string; selectorType: string; order: number }>) {
    return apiClient.patch<ApiResponse<CampaignClickSelector>>(`${BASE}/${id}/selectors/${selectorId}`, dto)
  },

  deleteSelector(id: string, selectorId: string) {
    return apiClient.delete(`${BASE}/${id}/selectors/${selectorId}`)
  },

  replaceSelectors(id: string, selectors: Partial<CampaignClickSelector>[]) {
    return apiClient.put<ApiResponse<CampaignClickSelector[]>>(`${BASE}/${id}/selectors`, { selectors })
  },

  // Sessions for a campaign
  sessions(campaignId: string, params?: { page?: number; limit?: number; status?: string }) {
    return apiClient.get<PaginatedResponse<BrowserSession>>(`${BASE}/${campaignId}/sessions`, params)
  },

  sessionStats(campaignId: string) {
    return apiClient.get<ApiResponse<{ total: number; queued: number; running: number; success: number; failed: number; cancelled: number; successRate: number }>>(`${BASE}/${campaignId}/sessions/stats`)
  },

  cancelSession(campaignId: string, sessionId: string) {
    return apiClient.post<ApiResponse<BrowserSession>>(`${BASE}/${campaignId}/sessions/${sessionId}/cancel`, {})
  },

  // Analytics
  analytics(campaignId: string) {
    return apiClient.get<ApiResponse<CampaignAnalytics>>(`/api/analytics/campaigns/${campaignId}`)
  },
}
