export const CampaignStatus = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  STOPPED: "STOPPED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const


export const LauncherType = {
  PLAYWRIGHT: "PLAYWRIGHT",
  CRAWLEE: "CRAWLEE"
} as const

export const BrowserEngine = {
  CHROMIUM: "CHROMIUM",
  FIREFOX: "FIREFOX",
  WEBKIT: "WEBKIT",
} as const

export type LauncherType = (typeof LauncherType)[keyof typeof LauncherType]
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus]
export type BrowserEngine = (typeof BrowserEngine)[keyof typeof BrowserEngine]


