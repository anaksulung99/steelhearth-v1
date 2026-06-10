export const WorkerStatus = {
  ONLINE: "ONLINE",
  BUSY: "BUSY",
  IDLE: "IDLE",
  OFFLINE: "OFFLINE",
  ERROR: "ERROR",
} as const

export type WorkerStatus = (typeof WorkerStatus)[keyof typeof WorkerStatus]
