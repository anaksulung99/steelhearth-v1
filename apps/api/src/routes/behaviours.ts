import type { FastifyInstance } from "fastify"
import { CreateBehaviourSchema, UpdateBehaviourSchema, QueryBehaviourSchema } from "@tb/contracts"
import * as svc from "../services/behaviour.service.js"
import { ok, paginated, buildMeta } from "../helpers/response.js"

const DEFAULT_USER_ID = "cmq7linvb0000k8vqj3iz8gt0"

export async function behaviourRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const query = QueryBehaviourSchema.parse(req.query)
    const { data, total, page, limit } = await svc.listBehaviours(DEFAULT_USER_ID, query)
    return paginated(data, buildMeta(total, page, limit))
  })

  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string }
    return ok(await svc.getBehaviour(DEFAULT_USER_ID, id))
  })

  app.post("/", async (req, reply) => {
    const dto = CreateBehaviourSchema.parse(req.body)
    return reply.status(201).send(ok(await svc.createBehaviour(DEFAULT_USER_ID, dto)))
  })

  app.patch("/:id", async (req) => {
    const { id } = req.params as { id: string }
    const dto = UpdateBehaviourSchema.parse(req.body)
    return ok(await svc.updateBehaviour(DEFAULT_USER_ID, id, dto))
  })

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string }
    await svc.deleteBehaviour(DEFAULT_USER_ID, id)
    return reply.status(204).send()
  })
}
