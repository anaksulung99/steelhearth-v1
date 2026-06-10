export const SessionStatus = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  TIMEOUT: "TIMEOUT",
} as const

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus]
