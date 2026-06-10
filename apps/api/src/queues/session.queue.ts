import { Queue } from "bullmq"
import { buildRedisOpts } from "../helpers/redis.js"

const QUEUE_NAME = "tb-session"

export interface SessionJobData {
  sessionId: string
  campaignId: string
  userId: string
  attempt: number
}

let _queue: Queue<SessionJobData> | null = null

export function getSessionQueue(): Queue<SessionJobData> {
  if (!_queue) {
    _queue = new Queue<SessionJobData>(QUEUE_NAME, {
      connection: buildRedisOpts(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 200 },
        removeOnFail: { count: 500 },
      },
    })
  }
  return _queue
}

export async function enqueueSession(data: SessionJobData) {
  const queue = getSessionQueue()
  return queue.add(`session-${data.sessionId}`, data, {
    jobId: `session-${data.sessionId}`,
  })
}

export async function closeSessionQueue() {
  if (_queue) {
    await _queue.close()
    _queue = null
  }
}
