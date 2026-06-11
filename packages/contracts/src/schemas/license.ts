import { z } from "zod"

// -----------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------

export const LicenseStatusSchema = z.enum([
  "NOT_ACTIVATED", "ACTIVE", "EXPIRED", "SUSPENDED", "DEVICE_MISMATCH", "REVOKED",
])

// -----------------------------------------------------------------------
// Activate License
// -----------------------------------------------------------------------

export const ActivateLicenseSchema = z.object({
  email: z.string().email(),
  licenseKey: z.string().min(10).max(255),
  deviceId: z.string().min(1).max(255),
  deviceName: z.string().max(100).optional(),
})

export type ActivateLicenseDto = z.infer<typeof ActivateLicenseSchema>

export const ValidateLicenseSchema = ActivateLicenseSchema

export type ValidateLicenseDto = z.infer<typeof ValidateLicenseSchema>

// -----------------------------------------------------------------------
// Reset License Activation
// -----------------------------------------------------------------------

export const ResetLicenseActivationSchema = z.object({
  email: z.string().email().optional(),
  licenseKey: z.string().min(1).max(255).optional(),
  resetToken: z.string().min(1).max(255),
}).refine((data) => data.email || data.licenseKey, {
  message: "email or licenseKey is required",
  path: ["email"],
})

export type ResetLicenseActivationDto = z.infer<typeof ResetLicenseActivationSchema>

// -----------------------------------------------------------------------
// License Response
// -----------------------------------------------------------------------

export const LicenseResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  licenseKey: z.string(),
  deviceId: z.string().nullable(),
  deviceName: z.string().nullable(),
  activatedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  lastValidatedAt: z.string().datetime().nullable(),
  offlineUntil: z.string().datetime().nullable(),
  status: LicenseStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type LicenseResponse = z.infer<typeof LicenseResponseSchema>
