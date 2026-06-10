import { prisma } from "@tb/database"
import { notFound } from "../helpers/errors.js"

export async function getCampaignAnalytics(userId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } })
  if (!campaign) throw notFound("Campaign")

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [counts, durationAgg, sessionsToday, byCountry] = await Promise.all([
    prisma.browserSession.groupBy({
      by: ["status"],
      where: { campaignId },
      _count: { id: true },
    }),
    prisma.browserSession.aggregate({
      where: { campaignId, status: "SUCCESS", durationMs: { not: null } },
      _avg: { durationMs: true },
    }),
    prisma.browserSession.count({
      where: { campaignId, createdAt: { gte: todayStart } },
    }),
    prisma.browserSession.groupBy({
      by: ["country", "countryCode"],
      where: { campaignId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    }),
  ])

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count.id]))
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
  const success = byStatus["SUCCESS"] ?? 0
  const failed = byStatus["FAILED"] ?? 0

  return {
    campaignId,
    totalSessions: total,
    successSessions: success,
    failedSessions: failed,
    cancelledSessions: byStatus["CANCELLED"] ?? 0,
    runningSessions: byStatus["RUNNING"] ?? 0,
    queuedSessions: byStatus["QUEUED"] ?? 0,
    successRate: total > 0 ? Math.round((success / total) * 100) : 0,
    avgDurationMs: durationAgg._avg.durationMs ?? null,
    sessionsToday,
    sessionsByCountry: byCountry.map((r) => ({
      country: r.country,
      countryCode: r.countryCode,
      count: r._count.id,
    })),
  }
}

export async function getDashboardStats(userId: string) {
  const [
    activeCampaigns,
    totalCampaigns,
    runningSessions,
    queuedSessions,
    activeProxies,
    totalProxies,
    workerStats,
  ] = await Promise.all([
    prisma.campaign.count({ where: { userId, status: "ACTIVE" } }),
    prisma.campaign.count({ where: { userId } }),
    prisma.browserSession.count({ where: { campaign: { userId }, status: "RUNNING" } }),
    prisma.browserSession.count({ where: { campaign: { userId }, status: "QUEUED" } }),
    prisma.proxy.count({ where: { proxyGroup: { userId }, status: "ACTIVE" } }),
    prisma.proxy.count({ where: { proxyGroup: { userId } } }),
    prisma.workerNode.aggregate({ _sum: { activeJobs: true }, _count: { id: true } }),
  ])

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [sessionsToday, successToday, failedToday] = await Promise.all([
    prisma.browserSession.count({ where: { campaign: { userId }, createdAt: { gte: todayStart } } }),
    prisma.browserSession.count({ where: { campaign: { userId }, status: "SUCCESS", completedAt: { gte: todayStart } } }),
    prisma.browserSession.count({ where: { campaign: { userId }, status: "FAILED", completedAt: { gte: todayStart } } }),
  ])

  const doneToday = successToday + failedToday

  return {
    activeCampaigns,
    totalCampaigns,
    runningSessions,
    queuedSessions,
    sessionsToday,
    successRateToday: doneToday > 0 ? Math.round((successToday / doneToday) * 100) : 0,
    activeProxies,
    totalProxies,
    onlineWorkers: workerStats._count.id,
    activeJobs: workerStats._sum.activeJobs ?? 0,
  }
}
