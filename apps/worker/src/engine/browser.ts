import { chromium, firefox, webkit, type Browser, type BrowserContext } from "playwright"
import { config } from "../config.js"
import type { PlaywrightProxy } from "./proxy.js"

type Engine = "CHROMIUM" | "FIREFOX" | "WEBKIT"
type DeviceType = "DESKTOP" | "MOBILE"

interface BrowserOptions {
  engine: Engine
  deviceType: DeviceType
  proxy: PlaywrightProxy | undefined
}

const VIEWPORTS: Record<DeviceType, { width: number; height: number }> = {
  DESKTOP: { width: 1366, height: 768 },
  MOBILE:  { width: 390,  height: 844 },
}

const USER_AGENTS: Record<DeviceType, string[]> = {
  DESKTOP: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  ],
  MOBILE: [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  ],
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

export interface SessionBrowser {
  browser: Browser
  context: BrowserContext
  close: () => Promise<void>
}

export async function launchBrowser(opts: BrowserOptions): Promise<SessionBrowser> {
  const launchFn = opts.engine === "FIREFOX" ? firefox : opts.engine === "WEBKIT" ? webkit : chromium

  const browser = await launchFn.launch({
    headless: config.browser.headless,
    timeout: config.browser.timeout,
    args: opts.engine === "CHROMIUM" ? [
      "--no-sandbox",
      "--disable-blink-features=AutomationControlled",
      "--disable-dev-shm-usage",
      "--disable-features=IsolateOrigins,site-per-process",
    ] : [],
  })

  const viewport = VIEWPORTS[opts.deviceType]
  const ua = pickRandom(USER_AGENTS[opts.deviceType])
  const isMobile = opts.deviceType === "MOBILE"

  const context = await browser.newContext({
    viewport,
    userAgent: ua,
    isMobile,
    hasTouch: isMobile,
    locale: "en-US",
    timezoneId: "America/New_York",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
    },
    ...(opts.proxy ? { proxy: opts.proxy } : {}),
  })

  // Basic stealth — hide webdriver
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined })
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] })
    Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] })
  })

  return {
    browser,
    context,
    close: async () => {
      await context.close().catch(() => {})
      await browser.close().catch(() => {})
    },
  }
}
