import { prisma } from "@tb/database"

type Level = "DEBUG" | "INFO" | "WARN" | "ERROR"
type Category = "SYSTEM" | "WORKER" | "SESSION" | "PROXY" | "API" | "SECURITY"

interface LogEntry {
  level: Level
  category: Category
  message: string
  sessionId?: string
  campaignId?: string
  workerId?: string
  data?: Record<string, unknown>
}

export async function writeLog(entry: LogEntry) {
  try {
    // Build data object without undefined keys (exactOptionalPropertyTypes)
    const record: Record<string, unknown> = {
      level: entry.level,
      category: entry.category,
      message: entry.message,
    }
    if (entry.sessionId !== undefined) record["sessionId"] = entry.sessionId
    if (entry.campaignId !== undefined) record["campaignId"] = entry.campaignId
    if (entry.workerId !== undefined) record["workerId"] = entry.workerId
    if (entry.data !== undefined) record["data"] = entry.data

    await (prisma.systemLog.create as Function)({ data: record })
  } catch {
    console.error("[logger] Failed to write log:", entry.message)
  }
}

export function makeLogger(defaults: Pick<LogEntry, "sessionId" | "campaignId" | "workerId">) {
  return {
    debug: (message: string, data?: Record<string, unknown>) =>
      writeLog({ level: "DEBUG", category: "SESSION", ...defaults, message, ...(data ? { data } : {}) }),
    info: (message: string, data?: Record<string, unknown>) =>
      writeLog({ level: "INFO", category: "SESSION", ...defaults, message, ...(data ? { data } : {}) }),
    warn: (message: string, data?: Record<string, unknown>) =>
      writeLog({ level: "WARN", category: "SESSION", ...defaults, message, ...(data ? { data } : {}) }),
    error: (message: string, data?: Record<string, unknown>) =>
      writeLog({ level: "ERROR", category: "SESSION", ...defaults, message, ...(data ? { data } : {}) }),
  }
}
