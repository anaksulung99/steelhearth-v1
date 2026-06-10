import type { FastifyInstance } from "fastify"
import {
  CreateProxyGroupSchema, UpdateProxyGroupSchema,
  BulkImportProxySchema, UpdateProxySchema, QueryProxySchema, CheckProxySchema,
} from "@tb/contracts"
import * as svc from "../services/proxy.service.js"
import { ok, paginated, buildMeta } from "../helpers/response.js"

const DEFAULT_USER_ID = "cmq7linvb0000k8vqj3iz8gt0"

export async function proxyRoutes(app: FastifyInstance) {
  // -----------------------------------------------------------------------
  // Proxy Groups
  // -----------------------------------------------------------------------

  app.get("/groups", async () => {
    return ok(await svc.listProxyGroups(DEFAULT_USER_ID))
  })

  app.get("/groups/:id", async (req) => {
    const { id } = req.params as { id: string }
    return ok(await svc.getProxyGroup(DEFAULT_USER_ID, id))
  })

  app.post("/groups", async (req, reply) => {
    const dto = CreateProxyGroupSchema.parse(req.body)
    return reply.status(201).send(ok(await svc.createProxyGroup(DEFAULT_USER_ID, dto)))
  })

  app.patch("/groups/:id", async (req) => {
    const { id } = req.params as { id: string }
    const dto = UpdateProxyGroupSchema.parse(req.body)
    return ok(await svc.updateProxyGroup(DEFAULT_USER_ID, id, dto))
  })

  app.delete("/groups/:id", async (req, reply) => {
    const { id } = req.params as { id: string }
    await svc.deleteProxyGroup(DEFAULT_USER_ID, id)
    return reply.status(204).send()
  })

  // Run live check for all proxies in a group and persist results
  app.post("/groups/:id/check", async (req) => {
    const { id } = req.params as { id: string }
    const { timeout, concurrency, targetUrl } = CheckProxySchema.parse(req.body)
    const result = await svc.checkGroupProxies(DEFAULT_USER_ID, id, {
      ...(timeout !== undefined ? { timeout } : {}),
      ...(concurrency !== undefined ? { concurrency } : {}),
      ...(targetUrl !== undefined ? { testUrl: targetUrl } : {}),
    })
    return ok(result)
  })

  // -----------------------------------------------------------------------
  // Proxies
  // -----------------------------------------------------------------------

  app.get("/", async (req) => {
    const query = QueryProxySchema.parse(req.query)
    const { data, total, page, limit } = await svc.listProxies(DEFAULT_USER_ID, query)
    return paginated(data, buildMeta(total, page, limit))
  })

  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string }
    return ok(await svc.getProxy(DEFAULT_USER_ID, id))
  })

  app.post("/bulk", async (req, reply) => {
    const dto = BulkImportProxySchema.parse(req.body)
    return reply.status(201).send(ok(await svc.bulkImportProxies(DEFAULT_USER_ID, dto)))
  })

  app.patch("/:id", async (req) => {
    const { id } = req.params as { id: string }
    const dto = UpdateProxySchema.parse(req.body)
    return ok(await svc.updateProxy(DEFAULT_USER_ID, id, dto))
  })

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string }
    await svc.deleteProxy(DEFAULT_USER_ID, id)
    return reply.status(204).send()
  })

  // Run live check for a single proxy and persist results
  app.post("/:id/check", async (req) => {
    const { id } = req.params as { id: string }
    const { timeout, targetUrl } = CheckProxySchema.parse(req.body)
    const result = await svc.checkProxyById(DEFAULT_USER_ID, id, {
      ...(timeout !== undefined ? { timeout } : {}),
      ...(targetUrl !== undefined ? { testUrl: targetUrl } : {}),
    })
    return ok(result)
  })
}
