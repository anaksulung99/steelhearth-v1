import type { WsEventType } from "@tb/contracts"

export interface WsEvent {
  event: WsEventType | string
  data: unknown
  timestamp: string
}

// Channel subscriptions: channel → Set of send functions
const subscriptions = new Map<string, Set<(event: WsEvent) => void>>()

export function subscribe(channel: string, send: (event: WsEvent) => void) {
  if (!subscriptions.has(channel)) subscriptions.set(channel, new Set())
  subscriptions.get(channel)!.add(send)
}

export function unsubscribe(channel: string, send: (event: WsEvent) => void) {
  subscriptions.get(channel)?.delete(send)
}

export function unsubscribeAll(send: (event: WsEvent) => void) {
  for (const subs of subscriptions.values()) subs.delete(send)
}

export function publish(channel: string, event: string, data: unknown) {
  const subs = subscriptions.get(channel)
  if (!subs?.size) return

  const envelope: WsEvent = { event, data, timestamp: new Date().toISOString() }
  for (const send of subs) {
    try {
      send(envelope)
    } catch {
      // client disconnected
    }
  }
}

// Convenience helpers for typed publishing

export function publishCampaignStatus(campaignId: string, status: string, event: string) {
  publish("campaign.status", event, { campaignId, status })
}

export function publishSessionEvent(
  sessionId: string,
  campaignId: string,
  eventType: string,
  data?: unknown,
) {
  publish("session.events", eventType, { sessionId, campaignId, eventType, ...Object(data) })
}

export function publishProxyStatus(proxyId: string, proxyGroupId: string, status: string) {
  publish("proxy.status", `proxy.${status.toLowerCase()}`, { proxyId, proxyGroupId, status })
}

export function publishWorkerStatus(workerId: string, status: string, activeJobs: number, maxConcurrency: number) {
  publish("worker.status", `worker.${status.toLowerCase()}`, { workerId, status, activeJobs, maxConcurrency })
}

export function publishAnalyticsUpdated(campaignId: string) {
  publish("analytics.updated", "analytics.updated", { campaignId })
}

export function publishLog(level: string, category: string, message: string, extra?: Record<string, unknown>) {
  publish("logs", "log.created", { level, category, message, ...extra })
}
