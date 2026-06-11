import {
  chromium,
  firefox,
  webkit,
  type Browser,
  type BrowserContext,
  type BrowserType,
} from "playwright"
import { FingerprintGenerator } from "fingerprint-generator"
import { FingerprintInjector } from "fingerprint-injector"
import type { PlaywrightProxy } from "../proxy/types.js"
import type { BrowserEngine, DeviceType } from "../utils/types.js"


export interface FingerprintHint {
  deviceType?: DeviceType
  osName?: string
  osVersion?: string | null
  browserName?: string
  browserVersion?: string | null
  userAgent?: string | null
  language?: string
  timezone?: string
  locale?: string
  viewportWidth?: number
  viewportHeight?: number
  deviceScaleFactor?: number
  isMobile?: boolean
  hasTouch?: boolean
  canvasMode?: string
  canvasSeed?: number | null
  webglVendor?: string | null
  webglRenderer?: string | null
  hardwareConcurrency?: number | null
  deviceMemory?: number | null
  extraConfig?: Record<string, any> | null
}

export interface LaunchOptions {
  engine: BrowserEngine
  headless?: boolean
  proxy?: PlaywrightProxy
  fingerprint?: FingerprintHint
  launchTimeout?: number
  navigationTimeout?: number
}

export interface SessionBrowser {
  browser: Browser
  context: BrowserContext
  /** Detected timezone used in this session */
  timezone: string
  /** UA used in this session */
  userAgent: string
  close: () => Promise<void>
}

const generator = new FingerprintGenerator()
const injector = new FingerprintInjector()

function engineLauncher(engine: BrowserEngine): BrowserType {
  if (engine === "FIREFOX") return firefox
  if (engine === "WEBKIT") return webkit
  return chromium
}

function resolveOs(osName?: string): string[] {
  if (!osName) return ["windows", "macos", "linux"]
  const n = osName.toLowerCase()
  if (n.includes("windows")) return ["windows"]
  if (n.includes("mac") || n.includes("darwin")) return ["macos"]
  if (n.includes("android")) return ["android"]
  if (n.includes("ios")) return ["ios"]
  return ["linux"]
}

function resolveBrowser(engine: BrowserEngine, browserName?: string): string[] {
  if (browserName) {
    const b = browserName.toLowerCase()
    if (b.includes("firefox")) return ["firefox"]
    if (b.includes("safari")) return ["safari"]
    if (b.includes("edge")) return ["edge"]
    return ["chrome"]
  }
  if (engine === "FIREFOX") return ["firefox"]
  if (engine === "WEBKIT") return ["safari"]
  return ["chrome"]
}

const CHROMIUM_ARGS = [
  "--no-sandbox",
  "--disable-blink-features=AutomationControlled",
  "--disable-dev-shm-usage",
  "--disable-features=IsolateOrigins,site-per-process",
  "--disable-ipc-flooding-protection",
  "--disable-renderer-backgrounding",
  "--metrics-recording-only",
  "--no-first-run",
]

export async function launchBrowser(opts: LaunchOptions): Promise<SessionBrowser> {
  const hint = opts.fingerprint ?? {}
  const isMobile = hint.isMobile ?? hint.deviceType === "MOBILE"

  // Generate fingerprint via fingerprint-generator
  const fp = generator.getFingerprint({
    devices: [isMobile ? "mobile" : "desktop"],
    operatingSystems: resolveOs(hint.osName) as any,
    browsers: resolveBrowser(opts.engine, hint.browserName) as any,
    locales: hint.language ? [hint.language] : ["en-US", "en-GB"],
  })

  const { fingerprint, headers } = fp

  // Prefer DB-provided values over generated ones
  const userAgent = hint.userAgent || (fingerprint as any).navigator?.userAgent || headers["user-agent"] || ""
  const timezone = hint.timezone || "America/New_York"
  const viewport = {
    width: hint.viewportWidth || (isMobile ? 390 : 1366),
    height: hint.viewportHeight || (isMobile ? 844 : 768),
  }

  const launcher = engineLauncher(opts.engine)

  const browser = await launcher.launch({
    headless: opts.headless ?? true,
    timeout: opts.launchTimeout ?? 30_000,
    args: opts.engine === "CHROMIUM" ? CHROMIUM_ARGS : [],
  })

  const context = await browser.newContext({
    viewport,
    userAgent,
    isMobile,
    hasTouch: isMobile,
    locale: hint.language ?? "en-US",
    timezoneId: timezone,
    extraHTTPHeaders: {
      "Accept-Language": headers["accept-language"] ?? "en-US,en;q=0.9",
    },
    ...(opts.proxy ? { proxy: opts.proxy } : {}),
  })

  // Inject full fingerprint (screen, plugins, canvas noise, etc.)
  // fp is BrowserFingerprintWithHeaders: { fingerprint, headers }
  await injector.attachFingerprintToPlaywright(context, fp)

  // Extra stealth init scripts — run in browser context (DOM is available at runtime)
  await context.addInitScript(`(function() {
    Object.defineProperty(navigator, "webdriver", { get: function() { return undefined; }, configurable: true });
    try {
      if ("Notification" in window) {
        Object.defineProperty(Notification, "permission", { get: function() { return "default"; } });
      }
    } catch(e) {}
    try { delete window.__playwright; } catch(e) {}
    try { delete window.__pw_manual; } catch(e) {}
  })()`)

  if (opts.navigationTimeout) {
    context.setDefaultNavigationTimeout(opts.navigationTimeout)
  }

  return {
    browser,
    context,
    timezone,
    userAgent,
    close: async () => {
      await context.close().catch(() => { })
      await browser.close().catch(() => { })
    },
  }
}