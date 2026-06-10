import { z } from "zod"

// -----------------------------------------------------------------------
// Setting Keys — well-known keys with validation
// -----------------------------------------------------------------------

export const SETTING_KEYS = {
  MAX_CONCURRENT_SESSIONS: "max_concurrent_sessions",
  DEFAULT_HEADLESS: "default_headless",
  PROXY_CHECK_URL: "proxy_check_url",
  SESSION_TIMEOUT_MS: "session_timeout_ms",
  NAVIGATION_TIMEOUT_MS: "navigation_timeout_ms",
  WORKER_HEARTBEAT_INTERVAL_MS: "worker_heartbeat_interval_ms",
  LOG_RETENTION_DAYS: "log_retention_days",
  API_TOKEN: "api_token",
} as const

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]

// -----------------------------------------------------------------------
// Upsert Setting
// -----------------------------------------------------------------------

export const UpsertSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(2000),
  isSecret: z.boolean().optional(),
})

export type UpsertSettingDto = z.infer<typeof UpsertSettingSchema>

export const BulkUpsertSettingSchema = z.object({
  settings: z.array(UpsertSettingSchema).min(1).max(50),
})

export type BulkUpsertSettingDto = z.infer<typeof BulkUpsertSettingSchema>

// -----------------------------------------------------------------------
// Setting Response
// -----------------------------------------------------------------------

export const SettingResponseSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  isSecret: z.boolean(),
  updatedAt: z.string().datetime(),
})

export type SettingResponse = z.infer<typeof SettingResponseSchema>
