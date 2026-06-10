import { prisma } from "@tb/database"
import type { QuerySessionDto } from "@tb/contracts"
import { notFound, conflict } from "../helpers/errors.js"
import { parsePagination } from "../helpers/pagination.js"

export async function listSessions(userId: string, query: QuerySessionDto) {
  const { page, limit, skip } = parsePagination(query)
  const where = {
    campaign: { userId },
    ...(query.campaignId ? { campaignId: query.campaignId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.proxyId ? { proxyId: query.proxyId } : {}),
    ...(query.dateFrom ? { startedAt: { gte: new Date(query.dateFrom) } } : {}),
    ...(query.dateTo ? { startedAt: { lte: new Date(query.dateTo) } } : {}),
  }
  const [data, total] = await Promise.all([
    prisma.browserSession.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: "desc" },
      include: { proxy: { select: { host: true, port: true, countryCode: true } } },
    }),
    prisma.browserSession.count({ where }),
  ])
  return { data, total, page, limit }
}

export async function getSession(userId: string, id: string) {
  const session = await prisma.browserSession.findFirst({
    where: { id, campaign: { userId } },
    include: {
      events: { orderBy: { createdAt: "asc" }, take: 100 },
      proxy: true,
    },
  })
  if (!session) throw notFound("Session")
  return session
}

export async function listCampaignSessions(userId: string, campaignId: string, query: QuerySessionDto) {
  // Verify ownership
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } })
  if (!campaign) throw notFound("Campaign")
  return listSessions(userId, { ...query, campaignId })
}

export async function getCampaignSessionStats(userId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } })
  if (!campaign) throw notFound("Campaign")

  const [total, queued, running, success, failed, cancelled] = await Promise.all([
    prisma.browserSession.count({ where: { campaignId } }),
    prisma.browserSession.count({ where: { campaignId, status: "QUEUED" } }),
    prisma.browserSession.count({ where: { campaignId, status: "RUNNING" } }),
    prisma.browserSession.count({ where: { campaignId, status: "SUCCESS" } }),
    prisma.browserSession.count({ where: { campaignId, status: "FAILED" } }),
    prisma.browserSession.count({ where: { campaignId, status: "CANCELLED" } }),
  ])

  const done = success + failed + cancelled
  const successRate = done > 0 ? Math.round((success / done) * 100) : 0

  return { total, queued, running, success, failed, cancelled, successRate }
}

export async function cancelSession(userId: string, id: string) {
  const session = await prisma.browserSession.findFirst({
    where: { id, campaign: { userId } },
  })
  if (!session) throw notFound("Session")
  if (!["QUEUED", "RUNNING"].includes(session.status)) {
    throw conflict(`Cannot cancel session with status ${session.status}`)
  }
  return prisma.browserSession.update({
    where: { id },
    data: { status: "CANCELLED", completedAt: new Date() },
  })
}
