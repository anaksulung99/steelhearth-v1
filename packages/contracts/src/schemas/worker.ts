import { z } from "zod"
import { PaginationQuerySchema } from "./common.js"

// -----------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------

export const WorkerStatusSchema = z.enum(["ONLINE", "BUSY", "IDLE", "OFFLINE", "ERROR"])

// -----------------------------------------------------------------------
// Worker Node Response
// -----------------------------------------------------------------------

export const WorkerNodeResponseSchema = z.object({
  id: z.string(),
  workerId: z.string(),
  hostname: z.string().nullable(),
  region: z.string().nullable(),
  status: WorkerStatusSchema,
  activeJobs: z.number(),
  maxConcurrency: z.number(),
  lastHeartbeatAt: z.string().datetime().nullable(),
  metadata: z.unknown().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type WorkerNodeResponse = z.infer<typeof WorkerNodeResponseSchema>

// -----------------------------------------------------------------------
// Worker Health Stats (for dashboard)
// -----------------------------------------------------------------------

export const WorkerHealthSchema = z.object({
  totalWorkers: z.number(),
  onlineWorkers: z.number(),
  busyWorkers: z.number(),
  totalActiveJobs: z.number(),
  totalCapacity: z.number(),
})

export type WorkerHealth = z.infer<typeof WorkerHealthSchema>

// -----------------------------------------------------------------------
// Query Workers
// -----------------------------------------------------------------------

export const QueryWorkerSchema = PaginationQuerySchema.extend({
  status: WorkerStatusSchema.optional(),
})

export type QueryWorkerDto = z.infer<typeof QueryWorkerSchema>
