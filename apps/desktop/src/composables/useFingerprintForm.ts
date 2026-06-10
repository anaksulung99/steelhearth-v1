import { computed, reactive, watch } from "vue"

// ─── Cascade Maps ────────────────────────────────────────────────────────────

export const DEVICE_OS_MAP: Record<string, string[]> = {
  DESKTOP: ["WINDOWS", "LINUX", "MACOS"],
  MOBILE: ["ANDROID", "IOS"],
}

export const OS_VERSION_MAP: Record<string, string[]> = {
  WINDOWS: ["11", "10"],
  LINUX: ["Ubuntu 24.04", "Ubuntu 22.04", "Fedora 40", "Debian 12"],
  MACOS: ["15", "14", "13"],
  ANDROID: ["15", "14", "13", "12"],
  IOS: ["18", "17", "16"],
}

export const OS_BROWSER_COMPAT: Record<string, string[]> = {
  WINDOWS: ["CHROME", "FIREFOX", "EDGE"],
  LINUX: ["CHROME", "FIREFOX"],
  MACOS: ["CHROME", "FIREFOX", "SAFARI", "EDGE"],
  ANDROID: ["CHROME_MOBILE", "FIREFOX_MOBILE"],
  IOS: ["SAFARI_MOBILE", "CHROME_MOBILE"],
}

export const BROWSER_VERSION_MAP: Record<string, string[]> = {
  CHROME: ["132", "131", "130", "129", "128", "127", "126", "124", "120"],
  FIREFOX: ["134", "133", "131", "128", "125", "121", "120"],
  SAFARI: ["18.3", "18.2", "18.1", "18.0", "17.6", "17.5", "17.4"],
  EDGE: ["132", "131", "130", "129", "128", "127", "124", "120"],
  CHROME_MOBILE: ["132", "131", "130", "128", "126", "124", "120"],
  SAFARI_MOBILE: ["18.3", "18.2", "18.1", "18.0", "17.6", "17.5"],
  FIREFOX_MOBILE: ["134", "133", "131", "128", "125", "121"],
}

export const OS_LABELS: Record<string, string> = {
  WINDOWS: "Windows",
  LINUX: "Linux",
  MACOS: "macOS",
  ANDROID: "Android",
  IOS: "iOS",
}

export const BROWSER_LABELS: Record<string, string> = {
  CHROME: "Google Chrome",
  FIREFOX: "Mozilla Firefox",
  SAFARI: "Safari (macOS)",
  EDGE: "Microsoft Edge",
  CHROME_MOBILE: "Chrome Mobile",
  SAFARI_MOBILE: "Safari Mobile",
  FIREFOX_MOBILE: "Firefox Mobile",
}

// ─── Viewport Presets ────────────────────────────────────────────────────────

const VIEWPORT_PRESETS: Record<string, [number, number, number]> = {
  DESKTOP_WINDOWS: [1920, 1080, 1],
  DESKTOP_LINUX: [1920, 1080, 1],
  DESKTOP_MACOS: [2560, 1600, 2],
  MOBILE_ANDROID: [412, 915, 2.625],
  MOBILE_IOS: [390, 844, 3],
}

// ─── WebGL Presets ───────────────────────────────────────────────────────────

const WEBGL_PRESETS: Record<string, { vendor: string; renderer: string }> = {
  CHROME_WINDOWS: {
    vendor: "Google Inc. (NVIDIA)",
    renderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)",
  },
  CHROME_LINUX: {
    vendor: "Google Inc. (Mesa)",
    renderer: "ANGLE (Mesa, AMD Radeon RX 580, OpenGL 4.6)",
  },
  CHROME_MACOS: { vendor: "Apple Inc.", renderer: "Apple M2" },
  CHROME_MOBILE_ANDROID: {
    vendor: "Qualcomm",
    renderer: "Adreno (TM) 740",
  },
  SAFARI_MOBILE_IOS: { vendor: "Apple Inc.", renderer: "Apple A16 GPU" },
  FIREFOX_WINDOWS: {
    vendor: "NVIDIA Corporation",
    renderer: "GeForce RTX 3060/PCIe/SSE2",
  },
  FIREFOX_LINUX: {
    vendor: "Mesa/X.org",
    renderer: "AMD Radeon RX 580 (POLARIS10, DRM 3.42.0)",
  },
  FIREFOX_MACOS: { vendor: "Apple Inc.", renderer: "Apple M2" },
  SAFARI_MACOS: { vendor: "Apple Inc.", renderer: "Apple M2" },
  EDGE_WINDOWS: {
    vendor: "Google Inc. (NVIDIA)",
    renderer: "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)",
  },
}

// ─── UA Builder ──────────────────────────────────────────────────────────────

export function buildUserAgent(
  osName: string,
  osVersion: string,
  browserName: string,
  browserVersion: string,
): string {
  const bv = browserVersion || "120"

  switch (browserName) {
    case "CHROME": {
      const osStr =
        osName === "WINDOWS"
          ? "Windows NT 10.0; Win64; x64"
          : osName === "MACOS"
            ? `Macintosh; Intel Mac OS X ${(osVersion || "14").replace(/\./g, "_")}_0`
            : "X11; Linux x86_64"
      return `Mozilla/5.0 (${osStr}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${bv}.0.0.0 Safari/537.36`
    }
    case "FIREFOX": {
      const osStr =
        osName === "WINDOWS"
          ? "Windows NT 10.0; Win64; x64"
          : osName === "MACOS"
            ? `Macintosh; Intel Mac OS X ${(osVersion || "14").replace(/\./g, "_")}`
            : "X11; Linux x86_64"
      return `Mozilla/5.0 (${osStr}; rv:${bv}.0) Gecko/20100101 Firefox/${bv}.0`
    }
    case "SAFARI": {
      const macVer = (osVersion || "14").replace(/\./g, "_")
      return `Mozilla/5.0 (Macintosh; Intel Mac OS X ${macVer}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${bv} Safari/605.1.15`
    }
    case "EDGE": {
      return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${bv}.0.0.0 Safari/537.36 Edg/${bv}.0.0.0`
    }
    case "CHROME_MOBILE": {
      const av = osVersion || "14"
      return `Mozilla/5.0 (Linux; Android ${av}; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${bv}.0.0.0 Mobile Safari/537.36`
    }
    case "SAFARI_MOBILE": {
      const iv = (osVersion || "17").replace(/\./g, "_")
      return `Mozilla/5.0 (iPhone; CPU iPhone OS ${iv}_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${bv} Mobile/15E148 Safari/605.1.15`
    }
    case "FIREFOX_MOBILE": {
      const av = osVersion || "14"
      return `Mozilla/5.0 (Android ${av}; Mobile; rv:${bv}.0) Gecko/${bv}.0 Firefox/${bv}.0`
    }
    default:
      return ""
  }
}

// ─── Form State ──────────────────────────────────────────────────────────────

export interface FingerprintFormState {
  name: string
  deviceType: string
  osName: string
  osVersion: string
  browserName: string
  browserVersion: string
  userAgent: string
  language: string
  languagesStr: string
  timezone: string
  locale: string
  viewportWidth: number
  viewportHeight: number
  deviceScaleFactor: number
  isMobile: boolean
  hasTouch: boolean
  canvasMode: string
  webglVendor: string
  webglRenderer: string
  hardwareConcurrency: number
  deviceMemory: number
}

export function defaultFingerprintForm(): FingerprintFormState {
  return {
    name: "",
    deviceType: "DESKTOP",
    osName: "WINDOWS",
    osVersion: "11",
    browserName: "CHROME",
    browserVersion: "132",
    userAgent: "",
    language: "en-US",
    languagesStr: "en-US, en",
    timezone: "Asia/Jakarta",
    locale: "en-US",
    viewportWidth: 1920,
    viewportHeight: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    canvasMode: "noise",
    webglVendor: "",
    webglRenderer: "",
    hardwareConcurrency: 8,
    deviceMemory: 8,
  }
}

// ─── Composable ──────────────────────────────────────────────────────────────

export function useFingerprintForm() {
  const form = reactive<FingerprintFormState>(defaultFingerprintForm())

  const availableOsOptions = computed(() => DEVICE_OS_MAP[form.deviceType] ?? [])
  const availableOsVersionOptions = computed(() => OS_VERSION_MAP[form.osName] ?? [])
  const availableBrowserOptions = computed(() => OS_BROWSER_COMPAT[form.osName] ?? [])
  const availableBrowserVersionOptions = computed(() => BROWSER_VERSION_MAP[form.browserName] ?? [])

  watch(
    () => form.deviceType,
    (dev) => {
      const validOs = DEVICE_OS_MAP[dev] ?? []
      if (!validOs.includes(form.osName)) {
        form.osName = validOs[0] ?? "WINDOWS"
        ensureOsVersion()
      }
      form.isMobile = dev === "MOBILE"
      form.hasTouch = dev === "MOBILE"
      ensureBrowserCompat()
    },
  )

  watch(
    () => form.osName,
    () => {
      ensureOsVersion()
      ensureBrowserCompat()
    },
  )

  watch(
    () => form.browserName,
    () => {
      const versions = BROWSER_VERSION_MAP[form.browserName] ?? []
      if (versions.length && !versions.includes(form.browserVersion)) {
        form.browserVersion = versions[0]
      }
    },
  )

  function ensureOsVersion() {
    const versions = OS_VERSION_MAP[form.osName] ?? []
    if (versions.length && !versions.includes(form.osVersion)) {
      form.osVersion = versions[0]
    }
  }

  function ensureBrowserCompat() {
    const valid = OS_BROWSER_COMPAT[form.osName] ?? []
    if (!valid.includes(form.browserName)) {
      form.browserName = valid[0] ?? "CHROME"
    }
    const versions = BROWSER_VERSION_MAP[form.browserName] ?? []
    if (versions.length && !versions.includes(form.browserVersion)) {
      form.browserVersion = versions[0]
    }
  }

  function applyPresets() {
    form.userAgent = buildUserAgent(form.osName, form.osVersion, form.browserName, form.browserVersion)

    const vpKey = `${form.deviceType}_${form.osName}`
    const [w, h, dpr] = VIEWPORT_PRESETS[vpKey] ?? (form.deviceType === "MOBILE" ? [390, 844, 3] : [1920, 1080, 1])
    form.viewportWidth = w
    form.viewportHeight = h
    form.deviceScaleFactor = dpr

    const webglKey = `${form.browserName}_${form.osName}`
    const webgl = WEBGL_PRESETS[webglKey]
    if (webgl) {
      form.webglVendor = webgl.vendor
      form.webglRenderer = webgl.renderer
    }

    if (form.deviceType === "DESKTOP") {
      form.hardwareConcurrency = 8
      form.deviceMemory = 8
    } else {
      form.hardwareConcurrency = 4
      form.deviceMemory = 4
    }

    form.language = "en-US"
    form.languagesStr = "en-US, en"
    form.locale = "en-US"
  }

  function generateUa() {
    form.userAgent = buildUserAgent(form.osName, form.osVersion, form.browserName, form.browserVersion)
  }

  // Convert form state to API payload
  function toPayload() {
    const languages = form.languagesStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    return {
      name: form.name,
      deviceType: form.deviceType,
      osName: form.osName,
      osVersion: form.osVersion || undefined,
      browserName: form.browserName,
      browserVersion: form.browserVersion || undefined,
      userAgent: form.userAgent || undefined,
      language: form.language,
      languages: languages.length ? languages : ["en-US", "en"],
      timezone: form.timezone,
      locale: form.locale,
      viewportWidth: form.viewportWidth,
      viewportHeight: form.viewportHeight,
      deviceScaleFactor: form.deviceScaleFactor,
      isMobile: form.isMobile,
      hasTouch: form.hasTouch,
      canvasMode: form.canvasMode,
      webglVendor: form.webglVendor || undefined,
      webglRenderer: form.webglRenderer || undefined,
      hardwareConcurrency: form.hardwareConcurrency,
      deviceMemory: form.deviceMemory || undefined,
    }
  }

  return {
    form,
    availableOsOptions,
    availableOsVersionOptions,
    availableBrowserOptions,
    availableBrowserVersionOptions,
    applyPresets,
    generateUa,
    toPayload,
    OS_LABELS,
    BROWSER_LABELS,
  }
}
