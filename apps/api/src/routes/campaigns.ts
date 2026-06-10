import type { FastifyInstance } from "fastify"
import {
  CreateCampaignSchema, UpdateCampaignSchema, QueryCampaignSchema,
  AddCampaignClickSelectorSchema, UpdateCampaignClickSelectorSchema, ReplaceCampaignClickSelectorsSchema,
  QuerySessionSchema,
} from "@tb/contracts"
import * as svc from "../services/campaign.service.js"
import * as sessionSvc from "../services/session.service.js"
import { ok, paginated, buildMeta } from "../helpers/response.js"

// Hardcoded userId for MVP (single-user desktop app)
const DEFAULT_USER_ID = "cmq7linvb0000k8vqj3iz8gt0"

export async function campaignRoutes(app: FastifyInstance) {
  // GET /api/campaigns
  app.get("/", async (req) => {
    const query = QueryCampaignSchema.parse(req.query)
    const { data, total, page, limit } = await svc.listCampaigns(DEFAULT_USER_ID, query)
    return paginated(data, buildMeta(total, page, limit))
  })

  // GET /api/campaigns/:id
  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string }
    return ok(await svc.getCampaign(DEFAULT_USER_ID, id))
  })

  // POST /api/campaigns
  app.post("/", async (req, reply) => {
    const dto = CreateCampaignSchema.parse(req.body)
    const campaign = await svc.createCampaign(DEFAULT_USER_ID, dto)
    return reply.status(201).send(ok(campaign))
  })

  // PATCH /api/campaigns/:id
  app.patch("/:id", async (req) => {
    const { id } = req.params as { id: string }
    const dto = UpdateCampaignSchema.parse(req.body)
    return ok(await svc.updateCampaign(DEFAULT_USER_ID, id, dto))
  })

  // DELETE /api/campaigns/:id
  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string }
    await svc.deleteCampaign(DEFAULT_USER_ID, id)
    return reply.status(204).send()
  })

  // POST /api/campaigns/:id/start|pause|stop
  app.post("/:id/start", async (req) => {
    const { id } = req.params as { id: string }
    return ok(await svc.setCampaignAction(DEFAULT_USER_ID, id, "start"))
  })

  app.post("/:id/pause", async (req) => {
    const { id } = req.params as { id: string }
    return ok(await svc.setCampaignAction(DEFAULT_USER_ID, id, "pause"))
  })

  app.post("/:id/stop", async (req) => {
    const { id } = req.params as { id: string }
    return ok(await svc.setCampaignAction(DEFAULT_USER_ID, id, "stop"))
  })

  // GET /api/campaigns/:id/sessions
  app.get("/:id/sessions", async (req) => {
    const { id } = req.params as { id: string }
    const query = QuerySessionSchema.parse(req.query)
    const { data, total, page, limit } = await sessionSvc.listCampaignSessions(DEFAULT_USER_ID, id, query)
    return paginated(data, buildMeta(total, page, limit))
  })

  // GET /api/campaigns/:id/sessions/stats — lightweight counts per status
  app.get("/:id/sessions/stats", async (req) => {
    const { id } = req.params as { id: string }
    return ok(await sessionSvc.getCampaignSessionStats(DEFAULT_USER_ID, id))
  })

  // POST /api/campaigns/:id/sessions/:sessionId/cancel
  app.post("/:id/sessions/:sessionId/cancel", async (req) => {
    const { sessionId } = req.params as { id: string; sessionId: string }
    return ok(await sessionSvc.cancelSession(DEFAULT_USER_ID, sessionId))
  })

  // -----------------------------------------------------------------------
  // Click Selectors
  // -----------------------------------------------------------------------

  // GET /api/campaigns/:id/selectors
  app.get("/:id/selectors", async (req) => {
    const { id } = req.params as { id: string }
    const campaign = await svc.getCampaign(DEFAULT_USER_ID, id)
    return ok(campaign.clickSelectors)
  })

  // POST /api/campaigns/:id/selectors
  app.post("/:id/selectors", async (req, reply) => {
    const { id } = req.params as { id: string }
    const dto = AddCampaignClickSelectorSchema.parse(req.body)
    const sel = await svc.addClickSelector(DEFAULT_USER_ID, id, dto as any)
    return reply.status(201).send(ok(sel))
  })

  // PUT /api/campaigns/:id/selectors — replace all
  app.put("/:id/selectors", async (req) => {
    const { id } = req.params as { id: string }
    const dto = ReplaceCampaignClickSelectorsSchema.parse(req.body)
    await svc.replaceClickSelectors(DEFAULT_USER_ID, id, dto.selectors as any)
    const campaign = await svc.getCampaign(DEFAULT_USER_ID, id)
    return ok(campaign.clickSelectors)
  })

  // PATCH /api/campaigns/:id/selectors/:selectorId
  app.patch("/:id/selectors/:selectorId", async (req) => {
    const { id, selectorId } = req.params as { id: string; selectorId: string }
    const dto = UpdateCampaignClickSelectorSchema.parse(req.body)
    return ok(await svc.updateClickSelector(DEFAULT_USER_ID, id, selectorId, dto as any))
  })

  // DELETE /api/campaigns/:id/selectors/:selectorId
  app.delete("/:id/selectors/:selectorId", async (req, reply) => {
    const { id, selectorId } = req.params as { id: string; selectorId: string }
    await svc.deleteClickSelector(DEFAULT_USER_ID, id, selectorId)
    return reply.status(204).send()
  })
}
