import * as z from "zod";
import { toTypedSchema } from "@vee-validate/zod";

/**
 * Authentication Schemas
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  license: z
    .string()
    .min(1, "License is required")
    .min(6, "License must be at least 6 characters"),
});



export const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export const LoginSchema = toTypedSchema(loginSchema);
export const ProfileSchema = toTypedSchema(profileSchema);

export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
