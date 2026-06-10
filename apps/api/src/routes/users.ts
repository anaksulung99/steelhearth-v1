import type { FastifyInstance } from "fastify"
import { createUserWithLicenseSchema, queryUserSchema, updateUserSchema } from "@tb/contracts"
import * as svc from "../services/user.service.js"
import { ok, paginated, buildMeta } from "../helpers/response.js"

export async function userRoutes(app: FastifyInstance) {
  app.get("/", async (req) => {
    const query = queryUserSchema.parse(req.query)
    const { data, total, page, limit } = await svc.listUsers(query)
    return paginated(data, buildMeta(total, page, limit))
  })

  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string }
    return ok(await svc.getUserById(id))
  })

  app.get("/find/:email", async (req) => {
    const { email } = req.params as { email: string }
    return ok(await svc.getUserByEmail(email))
  })

  app.get("/license/:license", async (req) => {
    const { license } = req.params as { license: string }
    return ok(await svc.getUserByLicense(license))
  })

  app.post("/", async (req, reply) => {
    const dto = createUserWithLicenseSchema.parse(req.body)
    return reply.status(201).send(ok(await svc.createUser(dto)))
  })

  app.put("/:id", async (req) => {
    const { id } = req.params as { id: string }
    const dto = updateUserSchema.parse(req.body)
    return ok(await svc.updateUser(id, dto))
  })

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string }
    await svc.deleteUser(id)
    return reply.status(204).send()
  })
}
