import { z } from "zod"

// -----------------------------------------------------------------------
// Time window format — "HH:mm"
// -----------------------------------------------------------------------

const TimeWindowSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:mm format (e.g. 08:00)")

const DayOfWeekSchema = z.number().int().min(0).max(6) // 0=Sun, 6=Sat

// -----------------------------------------------------------------------
// Create Campaign Schedule
// -----------------------------------------------------------------------

export const CreateScheduleSchema = z
  .object({
    isActive: z.boolean().default(true),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    daysOfWeek: z.array(DayOfWeekSchema).min(1).default([0, 1, 2, 3, 4, 5, 6]),
    timeWindowStart: TimeWindowSchema.optional(),
    timeWindowEnd: TimeWindowSchema.optional(),
    timezone: z.string().max(64).default("UTC"),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate && data.startDate >= data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "endDate must be after startDate",
      })
    }
    if (
      (data.timeWindowStart && !data.timeWindowEnd) ||
      (!data.timeWindowStart && data.timeWindowEnd)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timeWindowStart"],
        message: "Both timeWindowStart and timeWindowEnd must be set together",
      })
    }
    if (data.timeWindowStart && data.timeWindowEnd && data.timeWindowStart >= data.timeWindowEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timeWindowEnd"],
        message: "timeWindowEnd must be after timeWindowStart",
      })
    }
  })

export type CreateScheduleDto = z.infer<typeof CreateScheduleSchema>

// -----------------------------------------------------------------------
// Update Schedule
// -----------------------------------------------------------------------

export const UpdateScheduleSchema = z
  .object({
    isActive: z.boolean(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    daysOfWeek: z.array(DayOfWeekSchema).min(1),
    timeWindowStart: TimeWindowSchema.optional(),
    timeWindowEnd: TimeWindowSchema.optional(),
    timezone: z.string().max(64),
  })
  .partial()

export type UpdateScheduleDto = z.infer<typeof UpdateScheduleSchema>

// -----------------------------------------------------------------------
// Schedule Response
// -----------------------------------------------------------------------

export const ScheduleResponseSchema = z.object({
  id: z.string(),
  campaignId: z.string(),
  isActive: z.boolean(),
  startDate: z.string().datetime().nullable(),
  endDate: z.string().datetime().nullable(),
  daysOfWeek: z.array(z.number()),
  timeWindowStart: z.string().nullable(),
  timeWindowEnd: z.string().nullable(),
  timezone: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type ScheduleResponse = z.infer<typeof ScheduleResponseSchema>
