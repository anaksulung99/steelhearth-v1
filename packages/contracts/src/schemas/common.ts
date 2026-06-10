import { z } from "zod"

// -----------------------------------------------------------------------
// Pagination
// -----------------------------------------------------------------------

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
})

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>

export const PaginationMetaSchema = z.object({
  page: z.number().int(),
  limit: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
})

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>

// -----------------------------------------------------------------------
// Standard API Response Envelopes
// -----------------------------------------------------------------------

export function successResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  })
}

export function paginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    meta: PaginationMetaSchema,
  })
}

export const ErrorDetailSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
})

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: ErrorDetailSchema,
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

// -----------------------------------------------------------------------
// Error Codes
// -----------------------------------------------------------------------

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  CAMPAIGN_NOT_ACTIVE: "CAMPAIGN_NOT_ACTIVE",
  DAILY_LIMIT_REACHED: "DAILY_LIMIT_REACHED",
  SCHEDULE_OUTSIDE_WINDOW: "SCHEDULE_OUTSIDE_WINDOW",
  PROXY_NOT_AVAILABLE: "PROXY_NOT_AVAILABLE",
  PROXY_TIMEOUT: "PROXY_TIMEOUT",
  NAVIGATION_TIMEOUT: "NAVIGATION_TIMEOUT",
  BROWSER_CRASH: "BROWSER_CRASH",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_SELECTOR: "INVALID_SELECTOR",
  FINGERPRINT_INVALID: "FINGERPRINT_INVALID",
  WORKER_UNAVAILABLE: "WORKER_UNAVAILABLE",
  SESSION_TIMEOUT: "SESSION_TIMEOUT",
  LICENSE_INVALID: "LICENSE_INVALID",
  LICENSE_EXPIRED: "LICENSE_EXPIRED",
  DEVICE_MISMATCH: "DEVICE_MISMATCH",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

// -----------------------------------------------------------------------
// Common field schemas reused across modules
// -----------------------------------------------------------------------

export const CuidSchema = z.string().cuid()
export const UrlSchema = z.string().url()
export const NonEmptyStringSchema = z.string().min(1).max(255)
export const OptionalStringSchema = z.string().max(1000).optional()
