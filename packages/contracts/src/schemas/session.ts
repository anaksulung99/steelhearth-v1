import { z } from "zod"
import { PaginationQuerySchema } from "./common.js"

// -----------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------

export const SessionStatusSchema = z.enum([
  "QUEUED", "RUNNING", "SUCCESS", "FAILED", "CANCELLED", "TIMEOUT",
])

// -----------------------------------------------------------------------
// Session Response
// -----------------------------------------------------------------------

export const SessionResponseSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  launcherType: z.enum(["PLAYWRIGHT", "CRAWLEE"]).default("PLAYWRIGHT"),
  fingerprintProfileId: z.string().nullable(),
  behaviourProfileId: z.string().nullable(),
  proxyId: z.string().nullable(),
  workerNodeId: z.string().nullable(),
  targetUrl: z.string(),
  finalUrl: z.string().nullable(),
  status: SessionStatusSchema,
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  durationMs: z.number().nullable(),
  errorCode: z.string().nullable(),
  errorMessage: z.string().nullable(),
  ip: z.string().nullable(),
  country: z.string().nullable(),
  countryCode: z.string().nullable(),
  city: z.string().nullable(),
  userAgent: z.string().nullable(),
  httpStatus: z.number().nullable(),
  pageTitle: z.string().nullable(),
  retryCount: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type SessionResponse = z.infer<typeof SessionResponseSchema>

// -----------------------------------------------------------------------
// Session Event Response
// -----------------------------------------------------------------------

export const SessionEventResponseSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  campaignId: z.string(),
  eventType: z.string(),
  data: z.unknown().nullable(),
  createdAt: z.string().datetime(),
})

export type SessionEventResponse = z.infer<typeof SessionEventResponseSchema>

// -----------------------------------------------------------------------
// Query Sessions
// -----------------------------------------------------------------------

export const QuerySessionSchema = PaginationQuerySchema.extend({
  campaignId: z.string().cuid().optional(),
  status: SessionStatusSchema.optional(),
  proxyId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
})

export type QuerySessionDto = z.infer<typeof QuerySessionSchema>
