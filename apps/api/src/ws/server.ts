import type { IncomingMessage } from "node:http"
import type { Server } from "node:https"
import { WebSocketServer, WebSocket } from "ws"
import type { WsClientMessage } from "@tb/contracts"
import { subscribe, unsubscribeAll, unsubscribe, type WsEvent } from "./publisher.js"

export function createWsServer(httpServer: Server | import("node:http").Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" })

  wss.on("connection", (ws: WebSocket) => {
    // Per-client send function — used as subscription key
    const sendFn = (event: WsEvent) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event))
      }
    }

    ws.on("message", (raw) => {
      let msg: WsClientMessage
      try {
        msg = JSON.parse(raw.toString()) as WsClientMessage
      } catch {
        ws.send(JSON.stringify({ error: "Invalid JSON" }))
        return
      }

      if (msg.type === "subscribe") {
        for (const channel of msg.channels) subscribe(channel, sendFn)
        ws.send(JSON.stringify({ type: "subscribed", channels: msg.channels }))
      } else if (msg.type === "unsubscribe") {
        for (const channel of msg.channels) unsubscribe(channel, sendFn)
        ws.send(JSON.stringify({ type: "unsubscribed", channels: msg.channels }))
      }
    })

    ws.on("close", () => {
      unsubscribeAll(sendFn)
    })

    ws.on("error", () => {
      unsubscribeAll(sendFn)
    })

    // Send connected confirmation
    ws.send(JSON.stringify({ type: "connected", timestamp: new Date().toISOString() }))
  })

  return wss
}
