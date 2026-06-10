import type { FastifyInstance } from "fastify"
import { CreateScheduleSchema, UpdateScheduleSchema } from "@tb/contracts"
import * as svc from "../services/schedule.service.js"
import { ok } from "../helpers/response.js"

const DEFAULT_USER_ID = "cmq7linvb0000k8vqj3iz8gt0"

export async function scheduleRoutes(app: FastifyInstance) {
  // GET /api/campaigns/:campaignId/schedules
  app.get("/campaigns/:campaignId/schedules", async (req) => {
    const { campaignId } = req.params as { campaignId: string }
    return ok(await svc.listSchedules(DEFAULT_USER_ID, campaignId))
  })

  // POST /api/campaigns/:campaignId/schedules
  app.post("/campaigns/:campaignId/schedules", async (req, reply) => {
    const { campaignId } = req.params as { campaignId: string }
    const dto = CreateScheduleSchema.parse(req.body)
    return reply.status(201).send(ok(await svc.createSchedule(DEFAULT_USER_ID, campaignId, dto)))
  })

  // PATCH /api/schedules/:id
  app.patch("/schedules/:id", async (req) => {
    const { id } = req.params as { id: string }
    const dto = UpdateScheduleSchema.parse(req.body)
    return ok(await svc.updateSchedule(DEFAULT_USER_ID, id, dto))
  })

  // DELETE /api/schedules/:id
  app.delete("/schedules/:id", async (req, reply) => {
    const { id } = req.params as { id: string }
    await svc.deleteSchedule(DEFAULT_USER_ID, id)
    return reply.status(204).send()
  })
}
