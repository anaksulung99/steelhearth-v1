import { z } from "zod"
import { NonEmptyStringSchema, PaginationQuerySchema } from "./common.js"

// -----------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------

export const DeviceTypeSchema = z.enum(["DESKTOP", "MOBILE"])
export const OsNameSchema = z.enum(["WINDOWS", "LINUX", "MACOS", "ANDROID", "IOS"])
export const BrowserNameSchema = z.enum([
  "CHROME", "FIREFOX", "SAFARI", "EDGE",
  "CHROME_MOBILE", "SAFARI_MOBILE", "FIREFOX_MOBILE",
])
export const CanvasModeSchema = z.enum(["noise", "block", "off"])

// -----------------------------------------------------------------------
// Validation rules — OS/Browser consistency
// -----------------------------------------------------------------------

function validateOsBrowserConsistency(
  data: { deviceType: string; osName: string; browserName: string },
  ctx: z.RefinementCtx,
) {
  const desktopOs = ["WINDOWS", "LINUX", "MACOS"]
  const mobileOs = ["ANDROID", "IOS"]
  const desktopBrowsers = ["CHROME", "FIREFOX", "SAFARI", "EDGE"]
  const mobileBrowsers = ["CHROME_MOBILE", "SAFARI_MOBILE", "FIREFOX_MOBILE"]

  const isDesktop = data.deviceType === "DESKTOP"

  if (isDesktop && mobileOs.includes(data.osName)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["osName"],
      message: "Desktop device cannot use a mobile OS",
    })
  }

  if (!isDesktop && desktopOs.includes(data.osName)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["osName"],
      message: "Mobile device cannot use a desktop OS",
    })
  }

  if (isDesktop && mobileBrowsers.includes(data.browserName)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["browserName"],
      message: "Desktop device cannot use a mobile browser",
    })
  }

  if (!isDesktop && desktopBrowsers.includes(data.browserName)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["browserName"],
      message: "Mobile device cannot use a desktop browser",
    })
  }

  if (data.browserName === "SAFARI" && data.osName !== "MACOS") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["browserName"],
      message: "Safari desktop is only available on macOS",
    })
  }

  if (data.browserName === "SAFARI_MOBILE" && data.osName !== "IOS") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["browserName"],
      message: "Safari Mobile is only available on iOS",
    })
  }
}

// -----------------------------------------------------------------------
// Create Fingerprint Profile
// -----------------------------------------------------------------------

const FingerprintBaseSchema = z.object({
  name: NonEmptyStringSchema,
  deviceType: DeviceTypeSchema.default("DESKTOP"),
  osName: OsNameSchema.default("WINDOWS"),
  osVersion: z.string().max(50).optional(),
  browserName: BrowserNameSchema.default("CHROME"),
  browserVersion: z.string().max(50).optional(),
  userAgent: z.string().max(512).optional(),
  language: z.string().max(20).default("en-US"),
  languages: z.array(z.string().max(20)).min(1).default(["en-US", "en"]),
  timezone: z.string().max(64).default("America/New_York"),
  locale: z.string().max(20).default("en-US"),
  viewportWidth: z.number().int().min(320).max(3840).default(1280),
  viewportHeight: z.number().int().min(240).max(2160).default(720),
  deviceScaleFactor: z.number().min(1).max(3).default(1.0),
  isMobile: z.boolean().default(false),
  hasTouch: z.boolean().default(false),
  canvasMode: CanvasModeSchema.default("noise"),
  canvasSeed: z.number().int().optional(),
  webglVendor: z.string().max(255).optional(),
  webglRenderer: z.string().max(255).optional(),
  hardwareConcurrency: z.number().int().min(1).max(128).default(4),
  deviceMemory: z.number().int().min(1).max(128).optional(),
  extraConfig: z.record(z.string(), z.unknown()).optional(),
})

export const CreateFingerprintSchema = FingerprintBaseSchema.superRefine(
  validateOsBrowserConsistency,
)

export type CreateFingerprintDto = z.infer<typeof CreateFingerprintSchema>

// -----------------------------------------------------------------------
// Update Fingerprint Profile
// -----------------------------------------------------------------------

export const UpdateFingerprintSchema = FingerprintBaseSchema.partial().superRefine(
  (data, ctx) => {
    if (data.deviceType && data.osName && data.browserName) {
      validateOsBrowserConsistency(
        { deviceType: data.deviceType, osName: data.osName, browserName: data.browserName },
        ctx,
      )
    }
  },
)

export type UpdateFingerprintDto = z.infer<typeof UpdateFingerprintSchema>

// -----------------------------------------------------------------------
// Fingerprint Response
// -----------------------------------------------------------------------

export const FingerprintResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  deviceType: DeviceTypeSchema,
  osName: OsNameSchema,
  osVersion: z.string().nullable(),
  browserName: BrowserNameSchema,
  browserVersion: z.string().nullable(),
  userAgent: z.string().nullable(),
  language: z.string(),
  languages: z.array(z.string()),
  timezone: z.string(),
  locale: z.string(),
  viewportWidth: z.number(),
  viewportHeight: z.number(),
  deviceScaleFactor: z.number(),
  isMobile: z.boolean(),
  hasTouch: z.boolean(),
  canvasMode: z.string(),
  canvasSeed: z.number().nullable(),
  webglVendor: z.string().nullable(),
  webglRenderer: z.string().nullable(),
  hardwareConcurrency: z.number(),
  deviceMemory: z.number().nullable(),
  extraConfig: z.unknown().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type FingerprintResponse = z.infer<typeof FingerprintResponseSchema>

// -----------------------------------------------------------------------
// Query
// -----------------------------------------------------------------------

export const QueryFingerprintSchema = PaginationQuerySchema.extend({
  deviceType: DeviceTypeSchema.optional(),
  search: z.string().max(100).optional(),
})

export type QueryFingerprintDto = z.infer<typeof QueryFingerprintSchema>
