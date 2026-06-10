// Proxy
export type { PlaywrightProxy, ProxyRow } from "./proxy/types.js"
export type { ProxyStrategy, TrafficSource } from "./proxy/builder.js"
export { formatProxy, pickProxy, buildReferrer } from "./proxy/builder.js"
export type { ProxyCheckResult, CheckOptions, BatchCheckOptions } from "./proxy/checker.js"
export { checkProxy, checkProxies, resolveProxyStatus } from "./proxy/checker.js"

// Browser
export type { BrowserEngine, DeviceType, FingerprintHint, LaunchOptions, SessionBrowser } from "./browser/launch.js"
export { launchBrowser } from "./browser/launch.js"

// Simulator
export type { BehaviourConfig, SimulateResult, SimulateEvent } from "./simulator/types.js"
export { simulateBehaviour } from "./simulator/simulate.js"

// Utils
export { rand, sleep, pickRandom, pickRandomOr } from "./utils/random.js"
export { generateLicenseKey } from "./utils/license.js"