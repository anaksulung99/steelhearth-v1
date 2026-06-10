import { Worker, Queue, type ConnectionOptions } from "bullmq"
import { Redis as IORedis } from "ioredis"
import { config } from "./config.js"
import { QUEUE_NAMES } from "./queues/names.js"
import { processSession } from "./processors/session.processor.js"
import {
  registerWorkerNode,
  heartbeat,
  setWorkerStatus,
  deregisterWorkerNode,
} from "./services/worker-node.service.js"
import { writeLog } from "./helpers/logger.js"
import { buildRedisOpts } from "./helpers/redis.js"

// -----------------------------------------------------------------------
// Redis connection
// -----------------------------------------------------------------------

const connection = new IORedis(buildRedisOpts())

connection.on("error", (err: Error) => {
  console.error("[redis] Connection error:", err.message)
})

// -----------------------------------------------------------------------
// BullMQ Worker
// -----------------------------------------------------------------------

const connectionOpts: ConnectionOptions = connection as any

const sessionWorker = new Worker(
  QUEUE_NAMES.SESSION,
  processSession,
  {
    connection: connectionOpts,
    concurrency: config.worker.maxConcurrent,
    autorun: true,
  }
)

let activeJobs = 0

sessionWorker.on("active", () => {
  activeJobs++
  setWorkerStatus("BUSY", activeJobs).catch(() => {})
})

sessionWorker.on("completed", (_job, result) => {
  activeJobs = Math.max(0, activeJobs - 1)
  if (activeJobs === 0) setWorkerStatus("ONLINE", 0).catch(() => {})
  console.log(`[worker] Session ${result.sessionId} ${result.status} in ${result.durationMs}ms`)
})

sessionWorker.on("failed", (job, err) => {
  activeJobs = Math.max(0, activeJobs - 1)
  if (activeJobs === 0) setWorkerStatus("ONLINE", 0).catch(() => {})
  writeLog({
    level: "ERROR",
    category: "SESSION",
    message: `Job ${job?.id ?? "unknown"} failed: ${err.message}`,
    data: { jobId: job?.id, error: err.message },
  }).catch(() => {})
  console.error(`[worker] Job ${job?.id} failed:`, err.message)
})

sessionWorker.on("error", (err: Error) => {
  console.error("[worker] Worker error:", err.message)
})

// -----------------------------------------------------------------------
// Boot
// -----------------------------------------------------------------------

async function start() {
  console.log(`[worker] Starting worker node: ${config.worker.id}`)

  await registerWorkerNode()
  await setWorkerStatus("ONLINE", 0)
  console.log(`[worker] Registered as ${config.worker.id} (max ${config.worker.maxConcurrent} concurrent)`)

  await writeLog({
    level: "INFO",
    category: "SYSTEM",
    message: `Worker ${config.worker.id} started`,
    workerId: config.worker.id,
    data: { workerId: config.worker.id },
  })

  // Heartbeat loop
  const hbInterval = setInterval(async () => {
    await heartbeat(activeJobs).catch(() => {})
  }, config.worker.heartbeatInterval)

  console.log(`[worker] Listening on queue: ${QUEUE_NAMES.SESSION}`)

  // Show how many jobs are already waiting
  try {
    const q = new Queue(QUEUE_NAMES.SESSION, { connection: buildRedisOpts() as any })
    const counts = await q.getJobCounts("waiting", "active", "delayed", "failed")
    console.log(`[worker] Queue counts:`, counts)
    await q.close()
  } catch (e) {
    console.warn(`[worker] Could not read queue counts:`, (e as Error).message)
  }

  // Graceful shutdown
  async function shutdown(signal: string) {
    console.log(`[worker] Received ${signal}, shutting down...`)
    clearInterval(hbInterval)
    await sessionWorker.close()
    await deregisterWorkerNode()
    await writeLog({
      level: "INFO",
      category: "SYSTEM",
      message: `Worker ${config.worker.id} stopped`,
      workerId: config.worker.id,
      data: { workerId: config.worker.id },
    })
    await connection.quit()
    process.exit(0)
  }

  process.on("SIGINT", () => shutdown("SIGINT"))
  process.on("SIGTERM", () => shutdown("SIGTERM"))
}

start().catch((err) => {
  console.error("[worker] Fatal startup error:", err)
  process.exit(1)
})
