import type { FastifyInstance } from "fastify"
import { QuerySessionSchema } from "@tb/contracts"
import * as svc from "../services/session.service.js"
import { ok, paginated, buildMeta } from "../helpers/response.js"

const DEFAULT_USER_ID = "cmq7linvb0000k8vqj3iz8gt0"

export async function sessionRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const query = QuerySessionSchema.parse(req.query)
    const { data, total, page, limit } = await svc.listSessions(DEFAULT_USER_ID, query)
    return paginated(data, buildMeta(total, page, limit))
  })

  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string }
    return ok(await svc.getSession(DEFAULT_USER_ID, id))
  })

  app.get("/campaign/:campaignId", async (req) => {
    const { campaignId } = req.params as { campaignId: string }
    const query = QuerySessionSchema.parse(req.query)
    const { data, total, page, limit } = await svc.listCampaignSessions(DEFAULT_USER_ID, campaignId, query)
    return paginated(data, buildMeta(total, page, limit))
  })

  app.post("/:id/cancel", async (req) => {
    const { id } = req.params as { id: string }
    return ok(await svc.cancelSession(DEFAULT_USER_ID, id))
  })
}
