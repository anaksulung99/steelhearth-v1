import Fastify from "fastify"
import cors from "@fastify/cors"
import { config } from "./config.js"
import authPlugin from "./plugins/auth.js"
import { errorHandler } from "./helpers/errors.js"
import { registerRoutes } from "./routes/index.js"

export async function buildApp() {
  const isDev = config.env !== "production"
  const corsOrigin =
    config.api.corsOrigin === "false"
      ? false
      : config.api.corsOrigin === "*"
        ? true
        : config.api.corsOrigin.split(",").map((origin) => origin.trim()).filter(Boolean)

  const app = Fastify({
    logger: isDev
      ? {
          level: config.log.level,
          transport: { target: "pino-pretty", options: { colorize: true } },
        }
      : { level: config.log.level },
  })

  // CORS — desktop app connects via localhost
  await app.register(cors, {
    origin: isDev ? true : corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })

  // Parse JSON bodies
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => {
    try {
      done(null, JSON.parse(body as string))
    } catch (err) {
      done(err as Error, undefined)
    }
  })

  // Auth
  await app.register(authPlugin)

  // Health (no auth required — authPlugin skips it)
  app.get("/health", async () => ({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }))

  // All API routes
  await registerRoutes(app)

  // Global error handler (must be last)
  app.setErrorHandler(errorHandler)

  return app
}
