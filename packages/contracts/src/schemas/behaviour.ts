import { z } from "zod"
import { NonEmptyStringSchema, PaginationQuerySchema } from "./common.js"

// -----------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------

export const BehaviourTypeSchema = z.enum([
  "DEFAULT_READER",
  "MOBILE_CASUAL",
  "QUICK_SCANNER",
  "DEEP_ENGAGER",
  "CUSTOM_CLICKER",
])

export const SelectorTypeSchema = z.enum(["css", "xpath", "elementId"])

// -----------------------------------------------------------------------
// Custom Click Selector
// -----------------------------------------------------------------------

export const CustomClickSelectorSchema = z.object({
  selector: z.string().min(1).max(512),
  selectorType: SelectorTypeSchema.default("css"),
  description: z.string().max(255).optional(),
  order: z.number().int().min(0).default(0),
})

export type CustomClickSelectorDto = z.infer<typeof CustomClickSelectorSchema>

// -----------------------------------------------------------------------
// Create Behaviour Profile
// -----------------------------------------------------------------------

export const CreateBehaviourSchema = z
  .object({
    name: NonEmptyStringSchema,
    type: BehaviourTypeSchema.default("DEFAULT_READER"),
    minDwellSeconds: z.number().int().min(1).max(3600).default(10),
    maxDwellSeconds: z.number().int().min(1).max(3600).default(60),
    minScrollCount: z.number().int().min(0).max(100).default(2),
    maxScrollCount: z.number().int().min(0).max(100).default(8),
    scrollSpeedMin: z.number().int().min(10).max(5000).default(100),
    scrollSpeedMax: z.number().int().min(10).max(5000).default(500),
    enableInternalNav: z.boolean().default(false),
    maxInternalClicks: z.number().int().min(0).max(20).default(0),
    extraConfig: z.record(z.string(), z.unknown()).optional(),
    customClickSelectors: z.array(CustomClickSelectorSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.minDwellSeconds > data.maxDwellSeconds) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxDwellSeconds"],
        message: "maxDwellSeconds must be >= minDwellSeconds",
      })
    }
    if (data.minScrollCount > data.maxScrollCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxScrollCount"],
        message: "maxScrollCount must be >= minScrollCount",
      })
    }
    if (data.scrollSpeedMin > data.scrollSpeedMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scrollSpeedMax"],
        message: "scrollSpeedMax must be >= scrollSpeedMin",
      })
    }
    if (
      data.type === "CUSTOM_CLICKER" &&
      (!data.customClickSelectors || data.customClickSelectors.length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customClickSelectors"],
        message: "Custom Clicker behaviour requires at least one selector",
      })
    }
  })

export type CreateBehaviourDto = z.infer<typeof CreateBehaviourSchema>

// -----------------------------------------------------------------------
// Update Behaviour Profile
// -----------------------------------------------------------------------

export const UpdateBehaviourSchema = z
  .object({
    name: NonEmptyStringSchema,
    type: BehaviourTypeSchema,
    minDwellSeconds: z.number().int().min(1).max(3600),
    maxDwellSeconds: z.number().int().min(1).max(3600),
    minScrollCount: z.number().int().min(0).max(100),
    maxScrollCount: z.number().int().min(0).max(100),
    scrollSpeedMin: z.number().int().min(10).max(5000),
    scrollSpeedMax: z.number().int().min(10).max(5000),
    enableInternalNav: z.boolean(),
    maxInternalClicks: z.number().int().min(0).max(20),
    extraConfig: z.record(z.string(), z.unknown()).optional(),
    customClickSelectors: z.array(CustomClickSelectorSchema).optional(),
  })
  .partial()
  .superRefine((data, ctx) => {
    if (
      data.minDwellSeconds !== undefined &&
      data.maxDwellSeconds !== undefined &&
      data.minDwellSeconds > data.maxDwellSeconds
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxDwellSeconds"],
        message: "maxDwellSeconds must be >= minDwellSeconds",
      })
    }
  })

export type UpdateBehaviourDto = z.infer<typeof UpdateBehaviourSchema>

// -----------------------------------------------------------------------
// Behaviour Response
// -----------------------------------------------------------------------

export const BehaviourResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  type: BehaviourTypeSchema,
  minDwellSeconds: z.number(),
  maxDwellSeconds: z.number(),
  minScrollCount: z.number(),
  maxScrollCount: z.number(),
  scrollSpeedMin: z.number(),
  scrollSpeedMax: z.number(),
  enableInternalNav: z.boolean(),
  maxInternalClicks: z.number(),
  extraConfig: z.unknown().nullable(),
  customClickSelectors: z.array(z.object({
    id: z.string(),
    selector: z.string(),
    selectorType: z.string(),
    description: z.string().nullable(),
    order: z.number(),
  })).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type BehaviourResponse = z.infer<typeof BehaviourResponseSchema>

// -----------------------------------------------------------------------
// Query
// -----------------------------------------------------------------------

export const QueryBehaviourSchema = PaginationQuerySchema.extend({
  type: BehaviourTypeSchema.optional(),
  search: z.string().max(100).optional(),
})

export type QueryBehaviourDto = z.infer<typeof QueryBehaviourSchema>
