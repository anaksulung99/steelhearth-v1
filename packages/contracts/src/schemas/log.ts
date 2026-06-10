import { z } from "zod"
import { PaginationQuerySchema } from "./common.js"

// -----------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------

export const LogLevelSchema = z.enum(["DEBUG", "INFO", "WARN", "ERROR"])
export const LogCategorySchema = z.enum(["SYSTEM", "WORKER", "SESSION", "PROXY", "API", "SECURITY"])

// -----------------------------------------------------------------------
// System Log Response
// -----------------------------------------------------------------------

export const SystemLogResponseSchema = z.object({
  id: z.string(),
  level: LogLevelSchema,
  category: LogCategorySchema,
  message: z.string(),
  data: z.unknown().nullable(),
  sessionId: z.string().nullable(),
  campaignId: z.string().nullable(),
  workerId: z.string().nullable(),
  createdAt: z.string().datetime(),
})

export type SystemLogResponse = z.infer<typeof SystemLogResponseSchema>

// -----------------------------------------------------------------------
// Query Logs
// -----------------------------------------------------------------------

export const QueryLogSchema = PaginationQuerySchema.extend({
  level: LogLevelSchema.optional(),
  category: LogCategorySchema.optional(),
  campaignId: z.string().cuid().optional(),
  sessionId: z.string().cuid().optional(),
  workerId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().max(200).optional(),
})

export type QueryLogDto = z.infer<typeof QueryLogSchema>
