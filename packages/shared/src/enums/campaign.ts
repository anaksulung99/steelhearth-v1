export const CampaignStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  STOPPED: "STOPPED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const

export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus]

export const BrowserEngine = {
  CHROMIUM: "CHROMIUM",
  FIREFOX: "FIREFOX",
  WEBKIT: "WEBKIT",
} as const

export type BrowserEngine = (typeof BrowserEngine)[keyof typeof BrowserEngine]
