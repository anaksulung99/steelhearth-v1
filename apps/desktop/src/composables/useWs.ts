/**
 * Singleton WebSocket composable.
 * One connection shared across the entire app — call useWs() anywhere,
 * you always get the same underlying socket and reactive `connected` ref.
 */
import { ref } from "vue"
import { apiClient } from "@/api/client"

// ─── Types ────────────────────────────────────────────────────────────────────

export type WsEventHandler = (data: unknown) => void

// All channels the API server supports (ws/publisher.ts)
const ALL_CHANNELS = [
  "campaign.status",
  "session.events",
  "session.progress",
  "proxy.status",
  "worker.status",
  "analytics.updated",
  "logs",
]

// ─── Singleton state (module-level) ──────────────────────────────────────────

const connected = ref(false)
let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let intentionalClose = false

// event name → Set of handlers
const registry = new Map<string, Set<WsEventHandler>>()

// ─── Internal helpers ─────────────────────────────────────────────────────────

function wsUrl(): string {
  return apiClient.baseUrl.replace(/^https?/, (p) => (p === "https" ? "wss" : "ws")) + "/ws"
}

function dispatch(event: string, data: unknown) {
  registry.get(event)?.forEach((h) => {
    try { h(data) } catch { /* handler errors must not break the socket */ }
  })
}

function handleMessage(raw: string) {
  try {
    const msg = JSON.parse(raw) as {
      type?: string
      event?: string
      data?: unknown
    }
    // Control frames (type: "connected" / "subscribed") — ignore
    if (msg.type) return
    if (msg.event) dispatch(msg.event, msg.data ?? {})
  } catch { /* malformed JSON */ }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connect()
  }, 5000)
}

// ─── Public API ───────────────────────────────────────────────────────────────

function connect() {
  if (
    socket?.readyState === WebSocket.OPEN ||
    socket?.readyState === WebSocket.CONNECTING
  ) return
  intentionalClose = false

  try {
    socket = new WebSocket(wsUrl())
  } catch {
    scheduleReconnect()
    return
  }

  socket.onopen = () => {
    connected.value = true
    socket?.send(JSON.stringify({ type: "subscribe", channels: ALL_CHANNELS }))
  }

  socket.onmessage = (evt) => handleMessage(evt.data as string)

  socket.onclose = () => {
    connected.value = false
    socket = null
    if (!intentionalClose) scheduleReconnect()
  }

  socket.onerror = () => {
    socket?.close()
  }
}

function disconnect() {
  intentionalClose = true
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  socket?.close()
  socket = null
  connected.value = false
}

function on(event: string, handler: WsEventHandler) {
  if (!registry.has(event)) registry.set(event, new Set())
  registry.get(event)!.add(handler)
}

function off(event: string, handler: WsEventHandler) {
  registry.get(event)?.delete(handler)
}

// ─── Composable export ────────────────────────────────────────────────────────

export function useWs() {
  return { connected, connect, disconnect, on, off }
}
