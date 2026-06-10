import type { FastifyInstance } from "fastify"
import fp from "fastify-plugin"
import { prisma } from "@tb/database"

// Local API token auth — stored in app_settings.
// Skipped in dev if no token is configured.

async function hasValidLicenseSession(headers: Record<string, string | string[] | undefined>) {
  const email = headers["x-license-email"]
  const licenseKey = headers["x-license-key"]
  const deviceId = headers["x-device-id"]

  if (
    typeof email !== "string" ||
    typeof licenseKey !== "string" ||
    typeof deviceId !== "string"
  ) {
    return false
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { license: true },
  })

  const license = user?.license
  const isExpired = license?.expiresAt != null && license.expiresAt.getTime() <= Date.now()
  return Boolean(
    user?.isActive &&
    license &&
    license.licenseKey === licenseKey &&
    license.deviceId === deviceId &&
    license.status === "ACTIVE" &&
    !isExpired,
  )
}

async function authPlugin(app: FastifyInstance) {
  app.addHook("onRequest", async (request, reply) => {
    // Skip unauthenticated bootstrap endpoints.
    if (request.url === "/health" || request.url.startsWith("/api/license/")) return

    const setting = await prisma.appSetting.findFirst({
      where: { key: "api_token" },
    })

    // No token configured → allow in dev, reject in prod
    if (!setting?.value) {
      if (await hasValidLicenseSession(request.headers)) return
      if (process.env["NODE_ENV"] === "production") {
        return reply.status(401).send({
          success: false,
          error: { code: "UNAUTHORIZED", message: "API token not configured" },
        })
      }
      return
    }

    const token = request.headers["x-api-token"]
    if (token !== setting.value) {
      if (await hasValidLicenseSession(request.headers)) return

      return reply.status(401).send({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Invalid API token or license session" },
      })
    }
  })
}

export default fp(authPlugin, { name: "auth" })
