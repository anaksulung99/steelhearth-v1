import type { FastifyInstance } from "fastify"
import * as svc from "../services/analytics.service.js"
import { ok } from "../helpers/response.js"

const DEFAULT_USER_ID = "cmq7linvb0000k8vqj3iz8gt0"

export async function analyticsRoutes(app: FastifyInstance) {
  app.get("/dashboard", async () => {
    return ok(await svc.getDashboardStats(DEFAULT_USER_ID))
  })

  app.get("/campaigns/:campaignId", async (req) => {
    const { campaignId } = req.params as { campaignId: string }
    return ok(await svc.getCampaignAnalytics(DEFAULT_USER_ID, campaignId))
  })
}
