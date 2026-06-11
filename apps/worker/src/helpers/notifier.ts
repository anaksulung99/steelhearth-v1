import { config } from "../config.js"

/**
 * Notify the API server about status changes via HTTP.
 * Non-fatal — if the API is unreachable, the worker logs and continues.
 */
export async function notifyApi(path: string, body: unknown) {
  try {
    await fetch(`${config.api.url}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.api.token ? { "x-api-token": config.api.token } : {}),
        ...(config.api.internalToken ? { "x-internal-token": config.api.internalToken } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Non-fatal
  }
}

type SessionStatus = "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED"

const STATUS_EVENT: Record<SessionStatus, string> = {
  RUNNING: "session.started",
  SUCCESS: "session.completed",
  FAILED: "session.failed",
  CANCELLED: "session.cancelled",
}

export async function notifySessionStatus(
  sessionId: string,
  campaignId: string,
  status: SessionStatus,
  extra?: { durationMs?: number; pagesVisited?: number; error?: string },
) {
  await notifyApi("/internal/session-notify", {
    sessionId,
    campaignId,
    event: STATUS_EVENT[status],
    status,
    ...extra,
  })
}

export async function notifySessionProgress(
  sessionId: string,
  campaignId: string,
  progress: number,
) {
  await notifyApi("/internal/session-notify", {
    sessionId,
    campaignId,
    event: "session.progress",
    progress,
  })
}
