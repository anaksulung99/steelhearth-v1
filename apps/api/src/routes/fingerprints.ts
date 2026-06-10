import type { FastifyInstance } from "fastify"
import { CreateFingerprintSchema, UpdateFingerprintSchema, QueryFingerprintSchema } from "@tb/contracts"
import * as svc from "../services/fingerprint.service.js"
import { ok, paginated, buildMeta } from "../helpers/response.js"

const DEFAULT_USER_ID = "cmq7linvb0000k8vqj3iz8gt0"

export async function fingerprintRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const query = QueryFingerprintSchema.parse(req.query)
    const { data, total, page, limit } = await svc.listFingerprints(DEFAULT_USER_ID, query)
    return paginated(data, buildMeta(total, page, limit))
  })

  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string }
    return ok(await svc.getFingerprint(DEFAULT_USER_ID, id))
  })

  app.post("/", async (req, reply) => {
    const dto = CreateFingerprintSchema.parse(req.body)
    return reply.status(201).send(ok(await svc.createFingerprint(DEFAULT_USER_ID, dto)))
  })

  app.patch("/:id", async (req) => {
    const { id } = req.params as { id: string }
    const dto = UpdateFingerprintSchema.parse(req.body)
    return ok(await svc.updateFingerprint(DEFAULT_USER_ID, id, dto))
  })

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string }
    await svc.deleteFingerprint(DEFAULT_USER_ID, id)
    return reply.status(204).send()
  })
}
