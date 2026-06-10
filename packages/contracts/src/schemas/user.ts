import { z } from "zod"
import { NonEmptyStringSchema, PaginationQuerySchema } from "./common.js"

export const userRoleSchema = z.enum(["OWNER", "ADMIN", "USER"])
export const createUserSchema = z.object({
  name: z.string({ error: "Name is required" }).min(1).max(50),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string({ error: "Password is required" }).min(6, "Password must be at least 6 characters"),
  role: userRoleSchema.default("USER"),
})
export const createLicenseSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  licenseKey: z.string().min(1, "License key is required"),
  expiresAt: z.coerce.date({
    error: (issue) => issue.input === undefined
      ? "Expiry date is required"
      : "Invalid date format"
  }).default(() => {
    const today = new Date()
    today.setDate(today.getDate() + 30)
    return today
  }),
})

export const createUserWithLicenseSchema = createUserSchema.extend({
  licenseKey: z.string().min(1, "License key is required"),
  expiresAt: z.coerce.date({
    error: (issue) => issue.input === undefined
      ? "Expiry date is required"
      : "Invalid date format"
  }).default(() => {
    const today = new Date()
    today.setDate(today.getDate() + 30)
    return today
  }),
})

export const updateUserSchema = createUserSchema.partial().extend({
  isActive: z.boolean().optional(),
})
export const updateLicenseSchema = createLicenseSchema.partial()

export type CreateUserDto = z.infer<typeof createUserSchema>
export type UpdateUserDto = z.infer<typeof updateUserSchema>
export type CreateUserWithLicenseDto = z.infer<typeof createUserWithLicenseSchema>
export type CreateLicenseDto = z.infer<typeof createLicenseSchema>
export type UpdateLicenseDto = z.infer<typeof updateLicenseSchema>


export const queryUserSchema = PaginationQuerySchema.extend({
  role: userRoleSchema.optional(),
  search: z.string().max(100).optional(),
})

export type QueryUserDto = z.infer<typeof queryUserSchema>
