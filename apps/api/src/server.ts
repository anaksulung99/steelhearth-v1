import { buildApp } from "./app.js"
import { createWsServer } from "./ws/server.js"
import { config } from "./config.js"

async function start() {
  const app = await buildApp()

  // Attach WebSocket server to the same HTTP server
  app.ready().then(() => {
    createWsServer(app.server)
    app.log.info("WebSocket server attached at /ws")
  })

  try {
    await app.listen({ port: config.api.port, host: config.api.host })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
