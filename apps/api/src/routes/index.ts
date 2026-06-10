import type { FastifyInstance } from "fastify"
import { campaignRoutes } from "./campaigns.js"
import { fingerprintRoutes } from "./fingerprints.js"
import { proxyRoutes } from "./proxies.js"
import { behaviourRoutes } from "./behaviours.js"
import { scheduleRoutes } from "./schedules.js"
import { sessionRoutes } from "./sessions.js"
import { workerRoutes } from "./workers.js"
import { logRoutes } from "./logs.js"
import { settingRoutes } from "./settings.js"
import { analyticsRoutes } from "./analytics.js"
import { internalRoutes } from "./internal.js"
import { userRoutes } from "./users.js"
import { licenseRoutes } from "./license.js"

export async function registerRoutes(app: FastifyInstance) {
  await app.register(campaignRoutes, { prefix: "/api/campaigns" })
  await app.register(fingerprintRoutes, { prefix: "/api/fingerprints" })
  await app.register(proxyRoutes, { prefix: "/api/proxies" })
  await app.register(behaviourRoutes, { prefix: "/api/behaviours" })
  await app.register(scheduleRoutes, { prefix: "/api" })
  await app.register(sessionRoutes, { prefix: "/api/sessions" })
  await app.register(workerRoutes, { prefix: "/api/workers" })
  await app.register(logRoutes, { prefix: "/api/logs" })
  await app.register(settingRoutes, { prefix: "/api/settings" })
  await app.register(analyticsRoutes, { prefix: "/api/analytics" })
  await app.register(userRoutes, { prefix: "/api/users" })
  await app.register(licenseRoutes, { prefix: "/api/license" })
  await app.register(internalRoutes, { prefix: "/internal" })
}
