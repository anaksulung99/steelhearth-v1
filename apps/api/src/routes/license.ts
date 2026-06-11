import type { FastifyInstance } from "fastify"
import { ActivateLicenseSchema, ResetLicenseActivationSchema, ValidateLicenseSchema } from "@tb/contracts"
import * as svc from "../services/license.service.js"
import { ok } from "../helpers/response.js"
import { forbidden } from "../helpers/errors.js"

export async function licenseRoutes(app: FastifyInstance) {
  app.post("/activate", async (req) => {
    const dto = ActivateLicenseSchema.parse(req.body)
    return ok(await svc.activateLicense(dto))
  })

  app.post("/validate", async (req) => {
    const dto = ValidateLicenseSchema.parse(req.body)
    return ok(await svc.validateLicense(dto))
  })

  app.post("/reset-activation", async (req) => {
    const dto = ResetLicenseActivationSchema.parse(req.body)
    const expectedToken = process.env["LICENSE_RESET_TOKEN"]
    if (!expectedToken || dto.resetToken !== expectedToken) {
      throw forbidden("Invalid license reset token")
    }

    return ok(await svc.resetLicenseActivation({
      email: dto.email,
      licenseKey: dto.licenseKey,
    }))
  })
}
