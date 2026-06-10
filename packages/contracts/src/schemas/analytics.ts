import { z } from "zod"

// -----------------------------------------------------------------------
// Campaign Analytics
// -----------------------------------------------------------------------

export const CampaignAnalyticsSchema = z.object({
  campaignId: z.string(),
  totalSessions: z.number(),
  successSessions: z.number(),
  failedSessions: z.number(),
  cancelledSessions: z.number(),
  runningSessions: z.number(),
  queuedSessions: z.number(),
  successRate: z.number(),
  avgDurationMs: z.number().nullable(),
  sessionsToday: z.number(),
  sessionsByCountry: z.array(z.object({
    country: z.string().nullable(),
    countryCode: z.string().nullable(),
    count: z.number(),
  })),
})

export type CampaignAnalytics = z.infer<typeof CampaignAnalyticsSchema>

// -----------------------------------------------------------------------
// Proxy Analytics
// -----------------------------------------------------------------------

export const ProxyGroupAnalyticsSchema = z.object({
  proxyGroupId: z.string(),
  totalProxies: z.number(),
  activeProxies: z.number(),
  deadProxies: z.number(),
  uncheckedProxies: z.number(),
  slowProxies: z.number(),
  blockedProxies: z.number(),
  avgLatency: z.number().nullable(),
})

export type ProxyGroupAnalytics = z.infer<typeof ProxyGroupAnalyticsSchema>

// -----------------------------------------------------------------------
// Dashboard Overview
// -----------------------------------------------------------------------

export const DashboardStatsSchema = z.object({
  activeCampaigns: z.number(),
  totalCampaigns: z.number(),
  runningSessions: z.number(),
  queuedSessions: z.number(),
  sessionsToday: z.number(),
  successRateToday: z.number(),
  activeProxies: z.number(),
  totalProxies: z.number(),
  onlineWorkers: z.number(),
  activeJobs: z.number(),
})

export type DashboardStats = z.infer<typeof DashboardStatsSchema>
