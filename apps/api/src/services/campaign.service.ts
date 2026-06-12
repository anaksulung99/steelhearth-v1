import { prisma } from "@tb/database"
import type { CreateCampaignDto, UpdateCampaignDto, QueryCampaignDto } from "@tb/contracts"
import { notFound, conflict } from "../helpers/errors.js"
import { parsePagination } from "../helpers/pagination.js"
import { publishCampaignStatus } from "../ws/publisher.js"
import { clean } from "../helpers/prisma.js"
import { Job } from "bullmq"
import { enqueueSession, getSessionQueue } from "../queues/session.queue.js"

export async function listCampaigns(userId: string, query: QueryCampaignDto) {
  const { page, limit, skip } = parsePagination(query)
  const where = {
    userId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { clickSelectors: true },
    }),
    prisma.campaign.count({ where }),
  ])

  return { data, total, page, limit }
}

export async function getCampaign(userId: string, id: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId },
    include: {
      clickSelectors: { orderBy: { order: "asc" } },
      schedules: true,
      proxyGroups: { include: { proxyGroup: true } },
    },
  })
  if (!campaign) throw notFound("Campaign")
  return campaign
}

export async function createCampaign(userId: string, dto: CreateCampaignDto) {
  const { proxyGroupIds, clickSelectors, ...rest } = dto

  return prisma.campaign.create({
    data: {
      ...clean(rest),
      userId,
      proxyGroups: {
        create: proxyGroupIds.map((proxyGroupId) => ({ proxyGroupId })),
      },
      clickSelectors: {
        create: clickSelectors.map((s) => clean({
          selector: s.selector,
          selectorType: s.selectorType ?? "css",
          description: s.description,
          order: s.order ?? 0,
        })),
      },
    },
    include: { clickSelectors: true },
  })
}

export async function updateCampaign(userId: string, id: string, dto: UpdateCampaignDto) {
  const campaign = await prisma.campaign.findFirst({ where: { id, userId } })
  if (!campaign) throw notFound("Campaign")

  const { proxyGroupIds, clickSelectors, ...rest } = dto

  return prisma.campaign.update({
    where: { id },
    data: {
      ...clean(rest),
      ...(proxyGroupIds !== undefined
        ? {
          proxyGroups: {
            deleteMany: {},
            create: proxyGroupIds.map((proxyGroupId) => ({ proxyGroupId })),
          },
        }
        : {}),
      ...(clickSelectors !== undefined
        ? {
          clickSelectors: {
            deleteMany: {},
            create: clickSelectors.map((s) => ({
              selector: s.selector,
              selectorType: s.selectorType ?? "css",
              description: s.description,
              order: s.order ?? 0,
            })),
          },
        }
        : {}),
    },
    include: { clickSelectors: { orderBy: { order: "asc" } } },
  })
}

export async function deleteCampaign(userId: string, id: string) {
  const campaign = await prisma.campaign.findFirst({ where: { id, userId } })
  if (!campaign) throw notFound("Campaign")
  await prisma.campaign.delete({ where: { id } })
}

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ACTIVE"],
  ACTIVE: ["PAUSED", "STOPPED"],
  PAUSED: ["ACTIVE", "STOPPED"],
  STOPPED: ["ACTIVE"],
  COMPLETED: [],
  FAILED: ["ACTIVE"],
}

export async function setCampaignAction(userId: string, id: string, action: "start" | "pause" | "stop") {
  const campaign = await prisma.campaign.findFirst({ where: { id, userId } })
  if (!campaign) throw notFound("Campaign")

  const targetStatus = { start: "ACTIVE", pause: "PAUSED", stop: "STOPPED" }[action]
  const allowed = ALLOWED_TRANSITIONS[campaign.status] ?? []
  const isRecoveringActiveStart = action === "start" && campaign.status === "ACTIVE"

  if (!allowed.includes(targetStatus) && !isRecoveringActiveStart) {
    throw conflict(`Cannot ${action} a campaign with status ${campaign.status}`)
  }

  const updated = isRecoveringActiveStart
    ? campaign
    : await prisma.campaign.update({
      where: { id },
      data: { status: targetStatus as any },
    })

  if (!isRecoveringActiveStart) {
    publishCampaignStatus(id, targetStatus, `campaign.${action === "start" ? "started" : action === "pause" ? "paused" : "stopped"}`)
  }

  // Enqueue session jobs when campaign starts
  if (action === "start") {
    await enqueueCampaignSessions(userId, id)
  }

  // Pause removes pending BullMQ jobs but keeps DB sessions QUEUED so start can re-enqueue them.
  if (action === "pause") {
    await removeQueuedSessionJobs(id)
    await removePendingCampaignJobs(id)
  }

  // Stop cancels pending sessions and removes their BullMQ jobs.
  if (action === "stop") {
    await cancelQueuedSessions(id)
    await removePendingCampaignJobs(id)
  }

  return updated
}

async function cancelQueuedSessions(campaignId: string) {
  // Mark all QUEUED sessions as CANCELLED in DB
  const queued = await prisma.browserSession.findMany({
    where: { campaignId, status: "QUEUED" },
    select: { id: true },
  })
  if (!queued.length) return

  await prisma.browserSession.updateMany({
    where: { campaignId, status: "QUEUED" },
    data: { status: "CANCELLED", completedAt: new Date() },
  })

  await removeQueuedSessionJobs(campaignId, queued.map((session) => session.id))
}

async function removeQueuedSessionJobs(campaignId: string, sessionIds?: string[]) {
  const queued = sessionIds
    ? sessionIds.map((id) => ({ id }))
    : await prisma.browserSession.findMany({
      where: { campaignId, status: "QUEUED" },
      select: { id: true },
    })
  if (!queued.length) return

  const queue = getSessionQueue()
  await Promise.all(
    queued.map(async ({ id }) => {
      const job = await Job.fromId(queue, `session-${id}`)
      if (job) await job.remove().catch(() => {/* already processing */ })
    })
  )
}

async function removePendingCampaignJobs(campaignId: string) {
  const queue = getSessionQueue()
  const jobs = await queue.getJobs(["waiting", "delayed", "prioritized"], 0, -1)
  await Promise.all(
    jobs
      .filter((job) => job.data?.campaignId === campaignId)
      .map((job) => job.remove().catch(() => {/* already processing */ })),
  )
}

async function enqueueCampaignSessions(userId: string, campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      userId: true,
      targetUrl: true,
      launcherType: true,
      maxConcurrency: true,
      totalSessionsTarget: true,
      fingerprintProfileId: true,
      behaviourProfileId: true,
    },
  })
  if (!campaign) return

  // Step 1: Re-enqueue any QUEUED sessions already in DB (orphaned from previous failed enqueue attempts)
  const orphaned = await prisma.browserSession.findMany({
    where: { campaignId, status: "QUEUED" },
    select: { id: true, launcherType: true },
  })

  if (orphaned.length) {
    await prisma.browserSession.updateMany({
      where: { campaignId, status: "QUEUED" },
      data: {
        launcherType: campaign.launcherType,
        fingerprintProfileId: campaign.fingerprintProfileId,
        behaviourProfileId: campaign.behaviourProfileId,
      },
    })
  }

  // Step 2: Create new sessions for remaining target slots
  const successCount = await prisma.browserSession.count({
    where: { campaignId, status: "SUCCESS" },
  })
  const runningCount = await prisma.browserSession.count({
    where: { campaignId, status: "RUNNING" },
  })
  const remaining = campaign.totalSessionsTarget - successCount - runningCount - orphaned.length
  for (let i = 0; i < remaining; i++) {
    await prisma.browserSession.create({
      data: {
        campaignId,
        launcherType: campaign.launcherType,
        targetUrl: campaign.targetUrl,
        status: "QUEUED",
        fingerprintProfileId: campaign.fingerprintProfileId,
        behaviourProfileId: campaign.behaviourProfileId,
      },
    })
  }

  const { enqueued, failed } = await enqueueNextCampaignSessions(campaignId)

  if (enqueued === 0 && failed > 0) {
    throw conflict(`Failed to enqueue campaign sessions (${failed} failed)`)
  }

  console.log(`[campaign] ${campaignId}: enqueued ${enqueued} sessions (${failed} failed, max concurrency ${campaign.maxConcurrency})`)
}

async function countPendingQueueJobs(campaignId: string) {
  const queue = getSessionQueue()
  const jobs = await queue.getJobs(["waiting", "delayed", "prioritized"], 0, -1)
  return jobs.filter((job) => job.data?.campaignId === campaignId).length
}

async function hasPendingQueueJob(sessionId: string) {
  const queue = getSessionQueue()
  const job = await Job.fromId(queue, `session-${sessionId}`)
  if (!job) return false
  const state = await job.getState()
  return ["waiting", "delayed", "prioritized", "active"].includes(state)
}

export async function enqueueNextCampaignSessions(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      userId: true,
      status: true,
      launcherType: true,
      maxConcurrency: true,
    },
  })

  if (!campaign || campaign.status !== "ACTIVE") {
    return { enqueued: 0, failed: 0 }
  }

  const [runningCount, pendingQueueCount] = await Promise.all([
    prisma.browserSession.count({ where: { campaignId, status: "RUNNING" } }),
    countPendingQueueJobs(campaignId),
  ])
  const availableSlots = Math.max(0, campaign.maxConcurrency - runningCount - pendingQueueCount)
  if (availableSlots <= 0) {
    return { enqueued: 0, failed: 0 }
  }

  const queuedSessions = await prisma.browserSession.findMany({
    where: { campaignId, status: "QUEUED" },
    select: { id: true, launcherType: true },
    orderBy: { createdAt: "asc" },
    take: Math.max(availableSlots * 4, availableSlots),
  })

  let enqueued = 0
  let failed = 0

  for (const session of queuedSessions) {
    if (enqueued >= availableSlots) break
    if (await hasPendingQueueJob(session.id)) continue

    try {
      await enqueueSession({
        sessionId: session.id,
        campaignId,
        launcherType: session.launcherType ?? campaign.launcherType,
        userId: campaign.userId,
        attempt: 1,
      })
      enqueued++
    } catch (err) {
      failed++
      console.error(`[campaign] Failed to enqueue session ${session.id}:`, (err as Error).message)
    }
  }

  return { enqueued, failed }
}

// -----------------------------------------------------------------------
// Click Selectors
// -----------------------------------------------------------------------

export async function addClickSelector(userId: string, campaignId: string, dto: {
  selector: string; selectorType?: string; description?: string; order?: number
}) {
  await getCampaign(userId, campaignId) // ownership check
  return prisma.campaignClickSelector.create({
    data: clean({
      campaignId,
      selector: dto.selector,
      selectorType: dto.selectorType ?? "css",
      description: dto.description,
      order: dto.order ?? 0,
    }),
  })
}

export async function updateClickSelector(userId: string, campaignId: string, selectorId: string, dto: Partial<{
  selector: string; selectorType: string; description: string; order: number
}>) {
  await getCampaign(userId, campaignId)
  const sel = await prisma.campaignClickSelector.findFirst({ where: { id: selectorId, campaignId } })
  if (!sel) throw notFound("Selector")
  return prisma.campaignClickSelector.update({ where: { id: selectorId }, data: clean(dto) })
}

export async function deleteClickSelector(userId: string, campaignId: string, selectorId: string) {
  await getCampaign(userId, campaignId)
  const sel = await prisma.campaignClickSelector.findFirst({ where: { id: selectorId, campaignId } })
  if (!sel) throw notFound("Selector")
  await prisma.campaignClickSelector.delete({ where: { id: selectorId } })
}

export async function replaceClickSelectors(userId: string, campaignId: string, selectors: Array<{
  selector: string; selectorType?: string; description?: string; order?: number
}>) {
  await getCampaign(userId, campaignId)
  await prisma.campaignClickSelector.deleteMany({ where: { campaignId } })
  return prisma.campaignClickSelector.createMany({
    data: selectors.map((s) => clean({
      campaignId,
      selector: s.selector,
      selectorType: s.selectorType ?? "css",
      description: s.description,
      order: s.order ?? 0,
    })),
  })
}
