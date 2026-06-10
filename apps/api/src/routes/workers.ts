import type { FastifyInstance } from "fastify"
import { QueryWorkerSchema } from "@tb/contracts"
import * as svc from "../services/worker.service.js"
import { ok, paginated, buildMeta } from "../helpers/response.js"

export async function workerRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const query = QueryWorkerSchema.parse(req.query)
    const { data, total, page, limit } = await svc.listWorkers(query)
    return paginated(data, buildMeta(total, page, limit))
  })

  app.get("/health", async () => {
    return ok(await svc.getWorkerHealth())
  })
}
