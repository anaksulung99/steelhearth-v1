import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { prisma } from "@tb/database"
import { publishSessionEvent, publishCampaignStatus, publish } from "../ws/publisher.js"

const SessionNotifySchema = z.object({
  sessionId: z.string(),
  campaignId: z.string(),
  event: z.string(),
  status: z.string().optional(),
  progress: z.number().optional(),
  durationMs: z.number().optional(),
  pagesVisited: z.number().optional(),
  error: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
})

const TERMINAL = ["SUCCESS", "FAILED", "CANCELLED"] as const

async function checkCampaignCompletion(campaignId: string) {
  const [total, terminal] = await Promise.all([
    prisma.browserSession.count({ where: { campaignId } }),
    prisma.browserSession.count({ where: { campaignId, status: { in: [...TERMINAL] } } }),
  ])
  if (total === 0 || terminal < total) return

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { status: true },
  })
  // Only auto-complete if still ACTIVE (not manually stopped/paused)
  if (!campaign || campaign.status !== "ACTIVE") return

  const successCount = await prisma.browserSession.count({ where: { campaignId, status: "SUCCESS" } })
  const finalStatus = successCount > 0 ? "COMPLETED" : "FAILED"

  await prisma.campaign.update({ where: { id: campaignId }, data: { status: finalStatus as any } })
  publishCampaignStatus(campaignId, finalStatus, `campaign.${finalStatus.toLowerCase()}`)
}

export async function internalRoutes(app: FastifyInstance) {
  // Worker → API: notify session status change or progress update.
  // Auth is skipped here (same-machine loopback); the global auth plugin
  // allows unauthenticated requests in dev when no token is configured.
  app.post("/session-notify", async (req, reply) => {
    const { sessionId, campaignId, event, status, progress, data, ...rest } = SessionNotifySchema.parse(req.body)

    if (progress !== undefined) {
      publish("session.progress", "session.progress", { sessionId, campaignId, progress })
    }

    publishSessionEvent(sessionId, campaignId, event, {
      ...(status ? { status } : {}),
      ...rest,
      ...data,
    })

    if (status && (TERMINAL as readonly string[]).includes(status)) {
      await checkCampaignCompletion(campaignId)
    }

    return reply.status(204).send()
  })
}
