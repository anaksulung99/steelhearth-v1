import { z } from "zod"
import { NonEmptyStringSchema, OptionalStringSchema, PaginationQuerySchema, UrlSchema } from "./common.js"

// -----------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------

export const CampaignStatusSchema = z.enum([
  "DRAFT", "ACTIVE", "PAUSED", "STOPPED", "COMPLETED", "FAILED",
])

export const BrowserEngineSchema = z.enum(["CHROMIUM", "FIREFOX", "WEBKIT"])

const CampaignSelectorTypeSchema = z.enum(["css", "xpath", "elementId"])

// -----------------------------------------------------------------------
// Campaign Click Selector (campaign-level, merged with BehaviourProfile selectors at runtime)
// -----------------------------------------------------------------------

export const CampaignClickSelectorSchema = z.object({
  selector: z.string().min(1).max(512),
  selectorType: CampaignSelectorTypeSchema.default("css"),
  description: z.string().max(255).optional(),
  order: z.number().int().min(0).default(0),
})

export type CampaignClickSelectorDto = z.infer<typeof CampaignClickSelectorSchema>

export const CampaignClickSelectorResponseSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  selector: z.string(),
  selectorType: z.string(),
  description: z.string().nullable(),
  order: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type CampaignClickSelectorResponse = z.infer<typeof CampaignClickSelectorResponseSchema>

// -----------------------------------------------------------------------
// Create Campaign
// -----------------------------------------------------------------------

export const CreateCampaignSchema = z.object({
  name: NonEmptyStringSchema,
  targetUrl: UrlSchema,
  description: OptionalStringSchema,
  fingerprintProfileId: z.string().cuid().optional(),
  behaviourProfileId: z.string().cuid().optional(),
  proxyGroupIds: z.array(z.string().cuid()).default([]),
  totalSessionsTarget: z.number().int().min(0).default(0),
  dailyLimit: z.number().int().min(1).max(100000).default(100),
  sessionsPerHour: z.number().int().min(1).max(10000).default(10),
  headless: z.boolean().default(true),
  browserEngine: BrowserEngineSchema.default("CHROMIUM"),
  geoMode: z.enum(["proxy", "manual"]).default("proxy"),
  targetCountries: z.array(z.string().length(2)).default([]),
  // Campaign-specific click selectors — merged with BehaviourProfile selectors at runtime
  clickSelectors: z.array(CampaignClickSelectorSchema).default([]),
})

export type CreateCampaignDto = z.infer<typeof CreateCampaignSchema>

// -----------------------------------------------------------------------
// Update Campaign
// -----------------------------------------------------------------------

export const UpdateCampaignSchema = CreateCampaignSchema.partial().extend({
  fingerprintProfileId: z.string().cuid().nullable().optional(),
  behaviourProfileId: z.string().cuid().nullable().optional(),
})

export type UpdateCampaignDto = z.infer<typeof UpdateCampaignSchema>

// -----------------------------------------------------------------------
// Campaign Response
// -----------------------------------------------------------------------

export const CampaignResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  targetUrl: z.string(),
  description: z.string().nullable(),
  status: CampaignStatusSchema,
  fingerprintProfileId: z.string().nullable(),
  behaviourProfileId: z.string().nullable(),
  totalSessionsTarget: z.number(),
  dailyLimit: z.number(),
  sessionsPerHour: z.number(),
  headless: z.boolean(),
  browserEngine: BrowserEngineSchema,
  geoMode: z.string(),
  targetCountries: z.array(z.string()),
  clickSelectors: z.array(CampaignClickSelectorResponseSchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type CampaignResponse = z.infer<typeof CampaignResponseSchema>

// -----------------------------------------------------------------------
// Query Campaigns
// -----------------------------------------------------------------------

export const QueryCampaignSchema = PaginationQuerySchema.extend({
  status: CampaignStatusSchema.optional(),
  search: z.string().max(100).optional(),
})

export type QueryCampaignDto = z.infer<typeof QueryCampaignSchema>

// -----------------------------------------------------------------------
// Campaign Action (start / pause / stop)
// -----------------------------------------------------------------------

export const CampaignActionSchema = z.object({
  action: z.enum(["start", "pause", "stop"]),
})

export type CampaignActionDto = z.infer<typeof CampaignActionSchema>

// -----------------------------------------------------------------------
// Manage Campaign Click Selectors (CRUD setelah campaign dibuat)
// -----------------------------------------------------------------------

export const AddCampaignClickSelectorSchema = CampaignClickSelectorSchema

export type AddCampaignClickSelectorDto = z.infer<typeof AddCampaignClickSelectorSchema>

export const UpdateCampaignClickSelectorSchema = CampaignClickSelectorSchema.partial()

export type UpdateCampaignClickSelectorDto = z.infer<typeof UpdateCampaignClickSelectorSchema>

export const ReplaceCampaignClickSelectorsSchema = z.object({
  selectors: z.array(CampaignClickSelectorSchema),
})

export type ReplaceCampaignClickSelectorsDto = z.infer<typeof ReplaceCampaignClickSelectorsSchema>
