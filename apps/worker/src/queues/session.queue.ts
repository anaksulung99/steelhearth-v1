import { Queue, type ConnectionOptions } from "bullmq"
import { QUEUE_NAMES } from "./names.js"

export interface SessionJobData {
  sessionId: string
  campaignId: string
  userId: string
  attempt: number
}

export interface SessionJobResult {
  sessionId: string
  status: "COMPLETED" | "FAILED" | "CANCELLED" | "DEFERRED"
  durationMs: number
  pagesVisited: number
  error?: string
}

let _sessionQueue: Queue<SessionJobData, SessionJobResult> | null = null

export function getSessionQueue(connection: ConnectionOptions) {
  if (!_sessionQueue) {
    _sessionQueue = new Queue<SessionJobData, SessionJobResult>(QUEUE_NAMES.SESSION, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 500 },
      },
    })
  }
  return _sessionQueue
}
