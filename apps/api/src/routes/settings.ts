import type { FastifyInstance } from "fastify"
import { UpsertSettingSchema, BulkUpsertSettingSchema } from "@tb/contracts"
import * as svc from "../services/setting.service.js"
import { ok } from "../helpers/response.js"

const DEFAULT_USER_ID = "cmq7linvb0000k8vqj3iz8gt0"

export async function settingRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return ok(await svc.listSettings(DEFAULT_USER_ID))
  })

  app.put("/", async (req) => {
    const dto = BulkUpsertSettingSchema.parse(req.body)
    return ok(await svc.bulkUpsertSettings(DEFAULT_USER_ID, dto))
  })

  app.put("/:key", async (req) => {
    const { key } = req.params as { key: string }
    const body = req.body as { value: string; isSecret?: boolean }
    const dto = UpsertSettingSchema.parse({ key, ...body })
    return ok(await svc.upsertSetting(DEFAULT_USER_ID, dto))
  })

  app.delete("/:key", async (req, reply) => {
    const { key } = req.params as { key: string }
    await svc.deleteSetting(DEFAULT_USER_ID, key)
    return reply.status(204).send()
  })
}
