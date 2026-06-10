export const QUEUE_NAMES = {
  SESSION: "tb-session",
  PROXY_CHECK: "tb-proxy-check",
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]
