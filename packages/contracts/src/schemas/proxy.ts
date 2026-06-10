import { z } from "zod"
import { NonEmptyStringSchema, OptionalStringSchema, PaginationQuerySchema } from "./common.js"

// -----------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------

export const ProxyProtocolSchema = z.enum(["HTTP", "HTTPS", "SOCKS4", "SOCKS5"])
export const ProxyCategorySchema = z.enum(["RESIDENTIAL", "MOBILE", "DATACENTER", "UNKNOWN"])
export const ProxyStatusSchema = z.enum(["UNCHECKED", "ACTIVE", "DEAD", "SLOW", "BLOCKED"])

// -----------------------------------------------------------------------
// Proxy Group
// -----------------------------------------------------------------------

export const CreateProxyGroupSchema = z.object({
  name: NonEmptyStringSchema,
  description: OptionalStringSchema,
})

export type CreateProxyGroupDto = z.infer<typeof CreateProxyGroupSchema>

export const UpdateProxyGroupSchema = CreateProxyGroupSchema.partial()

export type UpdateProxyGroupDto = z.infer<typeof UpdateProxyGroupSchema>

export const ProxyGroupResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  _count: z.object({ proxies: z.number() }).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type ProxyGroupResponse = z.infer<typeof ProxyGroupResponseSchema>

// -----------------------------------------------------------------------
// Single Proxy
// -----------------------------------------------------------------------

const ProxyRawLineSchema = z.string()
  .min(1)
  .max(512)
  .regex(
    /^(https?|socks[45]):\/\/([\w.-]+(?::[\w!@#$%^&*()\-+=]+)?@)?[\w.-]+:\d{1,5}$/i,
    "Invalid proxy format. Expected: protocol://[user:pass@]host:port",
  )

export const CreateProxySchema = z.object({
  proxyGroupId: z.string().cuid(),
  raw: ProxyRawLineSchema,
  protocol: ProxyProtocolSchema.optional(),
  category: ProxyCategorySchema.default("UNKNOWN"),
})

export type CreateProxyDto = z.infer<typeof CreateProxySchema>

// -----------------------------------------------------------------------
// Bulk Proxy Import
// -----------------------------------------------------------------------

export const BulkImportProxySchema = z.object({
  proxyGroupId: z.string().cuid(),
  lines: z
    .string()
    .min(1)
    .max(500_000),
  protocol: ProxyProtocolSchema.optional(),
  category: ProxyCategorySchema.default("UNKNOWN"),
})

export type BulkImportProxyDto = z.infer<typeof BulkImportProxySchema>

export const BulkImportResultSchema = z.object({
  imported: z.number(),
  skipped: z.number(),
  failed: z.number(),
  errors: z.array(z.object({
    line: z.string(),
    reason: z.string(),
  })).optional(),
})

export type BulkImportResult = z.infer<typeof BulkImportResultSchema>

// -----------------------------------------------------------------------
// Update Proxy
// -----------------------------------------------------------------------

export const UpdateProxySchema = z.object({
  category: ProxyCategorySchema.optional(),
  status: ProxyStatusSchema.optional(),
})

export type UpdateProxyDto = z.infer<typeof UpdateProxySchema>

// -----------------------------------------------------------------------
// Proxy Response
// -----------------------------------------------------------------------

export const ProxyResponseSchema = z.object({
  id: z.string(),
  proxyGroupId: z.string(),
  protocol: ProxyProtocolSchema,
  category: ProxyCategorySchema,
  host: z.string(),
  port: z.number(),
  username: z.string().nullable(),
  status: ProxyStatusSchema,
  ip: z.string().nullable(),
  country: z.string().nullable(),
  countryCode: z.string().nullable(),
  region: z.string().nullable(),
  city: z.string().nullable(),
  timezone: z.string().nullable(),
  isp: z.string().nullable(),
  asn: z.string().nullable(),
  latency: z.number().nullable(),
  successCount: z.number(),
  failCount: z.number(),
  lastCheckedAt: z.string().datetime().nullable(),
  lastUsedAt: z.string().datetime().nullable(),
  raw: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type ProxyResponse = z.infer<typeof ProxyResponseSchema>

// -----------------------------------------------------------------------
// Query Proxies
// -----------------------------------------------------------------------

export const QueryProxySchema = PaginationQuerySchema.extend({
  proxyGroupId: z.string().cuid().optional(),
  status: ProxyStatusSchema.optional(),
  protocol: ProxyProtocolSchema.optional(),
  country: z.string().max(2).optional(),
  search: z.string().max(100).optional(),
})

export type QueryProxyDto = z.infer<typeof QueryProxySchema>

// -----------------------------------------------------------------------
// Check Proxy (single / group)
// -----------------------------------------------------------------------

export const CheckProxySchema = z.object({
  targetUrl: z.string().url().optional(),
  timeout: z.number().int().min(1000).max(60_000).optional(),
  concurrency: z.number().int().min(1).max(50).optional(),
})

export type CheckProxyDto = z.infer<typeof CheckProxySchema>
