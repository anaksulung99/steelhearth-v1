import type { FastifyInstance } from "fastify"
import { QueryLogSchema } from "@tb/contracts"
import * as svc from "../services/log.service.js"
import { ok, paginated, buildMeta } from "../helpers/response.js"

export async function logRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const query = QueryLogSchema.parse(req.query)
    const { data, total, page, limit } = await svc.listLogs(query)
    return paginated(data, buildMeta(total, page, limit))
  })
}
