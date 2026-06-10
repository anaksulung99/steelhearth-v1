import type { FastifyInstance } from "fastify"
import { ActivateLicenseSchema, ValidateLicenseSchema } from "@tb/contracts"
import * as svc from "../services/license.service.js"
import { ok } from "../helpers/response.js"

export async function licenseRoutes(app: FastifyInstance) {
  app.post("/activate", async (req) => {
    const dto = ActivateLicenseSchema.parse(req.body)
    return ok(await svc.activateLicense(dto))
  })

  app.post("/validate", async (req) => {
    const dto = ValidateLicenseSchema.parse(req.body)
    return ok(await svc.validateLicense(dto))
  })
}
