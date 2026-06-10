import { defineStore } from "pinia"
import { analyticsApi, ApiError } from "@/api"
import type { DashboardStats, CampaignAnalytics } from "@/api"

export const useAnalyticsStore = defineStore("analytics", () => {
  const dashboard = ref<DashboardStats | null>(null)
  const campaignAnalytics = ref<Record<string, CampaignAnalytics>>({})
  const loading = ref(false)

  async function fetchDashboard() {
    loading.value = true
    try {
      const res = await analyticsApi.dashboard()
      dashboard.value = res.data
    } catch (err) {
      if (err instanceof ApiError) console.warn("Analytics error:", err.message)
    } finally {
      loading.value = false
    }
  }

  async function fetchCampaign(campaignId: string) {
    try {
      const res = await analyticsApi.campaign(campaignId)
      campaignAnalytics.value[campaignId] = res.data
      return res.data
    } catch {
      return null
    }
  }

  return { dashboard, campaignAnalytics, loading, fetchDashboard, fetchCampaign }
})
