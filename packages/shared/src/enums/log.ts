export const LogLevel = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
} as const

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel]

export const LogCategory = {
  SYSTEM: "SYSTEM",
  WORKER: "WORKER",
  SESSION: "SESSION",
  PROXY: "PROXY",
  API: "API",
  SECURITY: "SECURITY",
} as const

export type LogCategory = (typeof LogCategory)[keyof typeof LogCategory]
