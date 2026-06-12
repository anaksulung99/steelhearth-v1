// Proxy
export type { PlaywrightProxy, ProxyRow } from "./proxy/types.js"
export type { ProxyStrategy, TrafficSource } from "./proxy/builder.js"
export { formatProxy, pickProxy, buildReferrer } from "./proxy/builder.js"
export type { ProxyCheckResult, CheckOptions, BatchCheckOptions } from "./proxy/checker.js"
export { checkProxy, checkProxies, resolveProxyStatus } from "./proxy/checker.js"

// Browser
export type {
  BrowserEngine,
  DeviceType,
  OSName,
  BrowserName,
  BrowserCapabilities
} from "./utils/types.js"
export {
  DEVICE_OS_MAP,
  OS_VERSION_MAP,
  OS_BROWSER_COMPAT,
  BROWSER_VERSION_MAP,
  OS_LABELS,
  BROWSER_LABELS,
  ENGINE_MAP,
  VIEWPORT_PRESETS,
  WEBGL_PRESETS,
} from "./utils/types.js"
export { getViewport, getWebGLVendor, generateUserAgent } from "./utils/preset.js"
export type { FingerprintHint, LaunchOptions, SessionBrowser } from "./browser/launch.js"
export { launchBrowser } from "./browser/launch.js"
export { CrawleeBrowserPool } from "./browser/crawlee.js"

// Simulator
export type { BehaviourConfig, SimulateResult, SimulateEvent } from "./simulator/types.js"
export { simulateBehaviour } from "./simulator/simulate.js"
export { CrawleeHumanBehaviourSimulator } from "./simulator/crawlee-simulator.js"

// Utils
export { rand, sleep, pickRandom, pickRandomOr } from "./utils/random.js"
export { generateLicenseKey } from "./utils/license.js"