export const DeviceType = {
  DESKTOP: "DESKTOP",
  MOBILE: "MOBILE",
} as const

export type DeviceType = (typeof DeviceType)[keyof typeof DeviceType]

export const OsName = {
  WINDOWS: "WINDOWS",
  LINUX: "LINUX",
  MACOS: "MACOS",
  ANDROID: "ANDROID",
  IOS: "IOS",
} as const

export type OsName = (typeof OsName)[keyof typeof OsName]

export const BrowserName = {
  CHROME: "CHROME",
  FIREFOX: "FIREFOX",
  SAFARI: "SAFARI",
  EDGE: "EDGE",
  CHROME_MOBILE: "CHROME_MOBILE",
  SAFARI_MOBILE: "SAFARI_MOBILE",
  FIREFOX_MOBILE: "FIREFOX_MOBILE",
} as const

export type BrowserName = (typeof BrowserName)[keyof typeof BrowserName]

export const DESKTOP_OS: OsName[] = ["WINDOWS", "LINUX", "MACOS"]
export const MOBILE_OS: OsName[] = ["ANDROID", "IOS"]

export const DESKTOP_BROWSERS: BrowserName[] = ["CHROME", "FIREFOX", "SAFARI", "EDGE"]
export const MOBILE_BROWSERS: BrowserName[] = ["CHROME_MOBILE", "SAFARI_MOBILE", "FIREFOX_MOBILE"]

export const SAFARI_ONLY_OS: OsName[] = ["MACOS"]
export const SAFARI_MOBILE_ONLY_OS: OsName[] = ["IOS"]
