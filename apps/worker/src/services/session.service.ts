import { prisma } from "@tb/database"
import { config } from "../config.js"

export async function loadSessionJob(sessionId: string) {
  const session = await prisma.browserSession.findUnique({
    where: { id: sessionId },
    include: {
      campaign: {
        include: {
          clickSelectors: { orderBy: { order: "asc" } },
          behaviourProfile: {
            include: { customClickSelectors: { orderBy: { order: "asc" } } },
          },
          fingerprintProfile: true,
          proxyGroups: {
            include: {
              proxyGroup: {
                include: {
                  proxies: {
                    where: { status: "ACTIVE" },
                    take: 50,
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!session) throw new Error(`Session ${sessionId} not found`)
  return session
}

export async function getWorkerNodeId(): Promise<string | null> {
  const node = await prisma.workerNode.findUnique({
    where: { workerId: config.worker.id },
    select: { id: true },
  })
  return node?.id ?? null
}

export async function markSessionRunning(sessionId: string) {
  const workerNodeId = await getWorkerNodeId()
  return prisma.browserSession.update({
    where: { id: sessionId },
    data: {
      status: "RUNNING",
      startedAt: new Date(),
      ...(workerNodeId ? { workerNodeId } : {}),
    },
  })
}

export async function markSessionQueued(sessionId: string) {
  return prisma.browserSession.update({
    where: { id: sessionId },
    data: {
      status: "QUEUED",
      startedAt: null,
      completedAt: null,
      durationMs: null,
      errorCode: null,
      errorMessage: null,
      workerNodeId: null,
    },
  })
}

export async function getCampaignStatus(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  })
  return campaign?.status ?? null
}

export async function markSessionSuccess(
  sessionId: string,
  opts: { durationMs: number; pagesVisited?: number; proxyId?: string; finalUrl?: string }
) {
  return prisma.browserSession.update({
    where: { id: sessionId },
    data: {
      status: "SUCCESS",
      completedAt: new Date(),
      durationMs: opts.durationMs,
      ...(opts.proxyId ? { proxyId: opts.proxyId } : {}),
      ...(opts.finalUrl ? { finalUrl: opts.finalUrl } : {}),
    },
  })
}

export async function markSessionRuntimeMetadata(
  sessionId: string,
  opts: {
    fingerprintProfileId?: string | null
    behaviourProfileId?: string | null
    proxyId?: string | null
    ip?: string | null
    country?: string | null
    countryCode?: string | null
    city?: string | null
    userAgent?: string | null
  }
) {
  return prisma.browserSession.update({
    where: { id: sessionId },
    data: {
      fingerprintProfileId: opts.fingerprintProfileId ?? null,
      behaviourProfileId: opts.behaviourProfileId ?? null,
      ...(opts.proxyId ? { proxyId: opts.proxyId } : {}),
      ...(opts.ip ? { ip: opts.ip } : {}),
      ...(opts.country ? { country: opts.country } : {}),
      ...(opts.countryCode ? { countryCode: opts.countryCode } : {}),
      ...(opts.city ? { city: opts.city } : {}),
      ...(opts.userAgent ? { userAgent: opts.userAgent } : {}),
    },
  })
}

export async function markSessionFailed(sessionId: string, error: string, errorCode?: string) {
  return prisma.browserSession.update({
    where: { id: sessionId },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      errorMessage: error,
      ...(errorCode ? { errorCode } : {}),
    },
  })
}

export async function markSessionCancelled(sessionId: string) {
  return prisma.browserSession.update({
    where: { id: sessionId },
    data: { status: "CANCELLED", completedAt: new Date() },
  })
}

export async function addSessionEvent(
  sessionId: string,
  campaignId: string,
  eventType: string,
  data?: Record<string, unknown>
) {
  return (prisma.sessionEvent.create as Function)({
    data: {
      sessionId,
      campaignId,
      eventType,
      ...(data ? { data } : {}),
    },
  })
}
