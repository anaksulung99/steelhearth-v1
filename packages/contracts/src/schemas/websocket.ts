import { z } from "zod"

// -----------------------------------------------------------------------
// WebSocket Channels
// -----------------------------------------------------------------------

export const WS_CHANNELS = {
  CAMPAIGN_STATUS: "campaign.status",
  SESSION_EVENTS: "session.events",
  SESSION_PROGRESS: "session.progress",
  PROXY_STATUS: "proxy.status",
  WORKER_STATUS: "worker.status",
  ANALYTICS_UPDATED: "analytics.updated",
  LOGS: "logs",
} as const

export type WsChannel = (typeof WS_CHANNELS)[keyof typeof WS_CHANNELS]

// -----------------------------------------------------------------------
// WebSocket Event Types
// -----------------------------------------------------------------------

export const WS_EVENTS = {
  // Campaign
  CAMPAIGN_CREATED: "campaign.created",
  CAMPAIGN_STARTED: "campaign.started",
  CAMPAIGN_PAUSED: "campaign.paused",
  CAMPAIGN_STOPPED: "campaign.stopped",
  CAMPAIGN_COMPLETED: "campaign.completed",
  CAMPAIGN_FAILED: "campaign.failed",
  // Session
  SESSION_QUEUED: "session.queued",
  SESSION_STARTED: "session.started",
  SESSION_NAVIGATING: "session.navigating",
  SESSION_LOADED: "session.loaded",
  SESSION_BEHAVIOUR_RUNNING: "session.behaviour.running",
  SESSION_COMPLETED: "session.completed",
  SESSION_FAILED: "session.failed",
  SESSION_CANCELLED: "session.cancelled",
  // Proxy
  PROXY_CHECKING: "proxy.checking",
  PROXY_ACTIVE: "proxy.active",
  PROXY_DEAD: "proxy.dead",
  PROXY_SLOW: "proxy.slow",
  PROXY_BLOCKED: "proxy.blocked",
  // Worker
  WORKER_ONLINE: "worker.online",
  WORKER_BUSY: "worker.busy",
  WORKER_IDLE: "worker.idle",
  WORKER_OFFLINE: "worker.offline",
  WORKER_ERROR: "worker.error",
  // Analytics
  ANALYTICS_UPDATED: "analytics.updated",
  // Log
  LOG_CREATED: "log.created",
} as const

export type WsEventType = (typeof WS_EVENTS)[keyof typeof WS_EVENTS]

// -----------------------------------------------------------------------
// Client → Server: Subscribe
// -----------------------------------------------------------------------

export const WsSubscribeSchema = z.object({
  type: z.literal("subscribe"),
  channels: z.array(z.string()).min(1),
})

export type WsSubscribePayload = z.infer<typeof WsSubscribeSchema>

export const WsUnsubscribeSchema = z.object({
  type: z.literal("unsubscribe"),
  channels: z.array(z.string()).min(1),
})

export type WsUnsubscribePayload = z.infer<typeof WsUnsubscribeSchema>

export const WsClientMessageSchema = z.discriminatedUnion("type", [
  WsSubscribeSchema,
  WsUnsubscribeSchema,
])

export type WsClientMessage = z.infer<typeof WsClientMessageSchema>

// -----------------------------------------------------------------------
// Server → Client: Event Envelope
// -----------------------------------------------------------------------

export const WsEventEnvelopeSchema = z.object({
  event: z.string(),
  data: z.unknown(),
  timestamp: z.string().datetime(),
})

export type WsEventEnvelope = z.infer<typeof WsEventEnvelopeSchema>

// -----------------------------------------------------------------------
// Typed Event Payloads
// -----------------------------------------------------------------------

export const WsCampaignStatusPayloadSchema = z.object({
  campaignId: z.string(),
  status: z.string(),
  name: z.string().optional(),
})

export const WsSessionEventPayloadSchema = z.object({
  sessionId: z.string(),
  campaignId: z.string(),
  status: z.string(),
  eventType: z.string(),
  ip: z.string().optional(),
  country: z.string().optional(),
  durationMs: z.number().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
})

export const WsProxyStatusPayloadSchema = z.object({
  proxyId: z.string(),
  proxyGroupId: z.string(),
  status: z.string(),
  latency: z.number().optional(),
  country: z.string().optional(),
})

export const WsWorkerStatusPayloadSchema = z.object({
  workerId: z.string(),
  status: z.string(),
  activeJobs: z.number(),
  maxConcurrency: z.number(),
})

export const WsLogPayloadSchema = z.object({
  level: z.string(),
  category: z.string(),
  message: z.string(),
  campaignId: z.string().optional(),
  sessionId: z.string().optional(),
  workerId: z.string().optional(),
})
