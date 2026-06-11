export type BrowserEngine = "CHROMIUM" | "FIREFOX" | "WEBKIT"
export type DeviceType = "DESKTOP" | "MOBILE"
export type OSName = "WINDOWS" | "LINUX" | "MACOS" | "ANDROID" | "IOS";
export type BrowserName =
  | "CHROME" | "FIREFOX" | "SAFARI" | "EDGE"
  | "CHROME_MOBILE" | "SAFARI_MOBILE" | "FIREFOX_MOBILE";

export const DEVICE_OS_MAP: Record<DeviceType, OSName[]> = {
  DESKTOP: ["WINDOWS", "LINUX", "MACOS"],
  MOBILE: ["ANDROID", "IOS"],
};

export const OS_VERSION_MAP: Record<OSName, string[]> = {
  WINDOWS: ["11", "10"],
  LINUX: ["Ubuntu 24.04", "Ubuntu 22.04", "Fedora 40", "Debian 12"],
  MACOS: ["15", "14", "13"],
  ANDROID: ["15", "14", "13", "12"],
  IOS: ["18", "17", "16"],
};

export const OS_BROWSER_COMPAT: Record<OSName, BrowserName[]> = {
  WINDOWS: ["CHROME", "FIREFOX", "EDGE"],
  LINUX: ["CHROME", "FIREFOX"],
  MACOS: ["CHROME", "FIREFOX", "SAFARI", "EDGE"],
  ANDROID: ["CHROME_MOBILE", "FIREFOX_MOBILE"],
  IOS: ["SAFARI_MOBILE", "CHROME_MOBILE"],
};

export const BROWSER_VERSION_MAP: Record<BrowserName, string[]> = {
  CHROME: ["132", "131", "130", "129", "128", "127", "126", "124", "120"],
  FIREFOX: ["134", "133", "131", "128", "125", "121", "120"],
  SAFARI: ["18.3", "18.2", "18.1", "18.0", "17.6", "17.5", "17.4"],
  EDGE: ["132", "131", "130", "129", "128", "127", "124", "120"],
  CHROME_MOBILE: ["132", "131", "130", "128", "126", "124", "120"],
  SAFARI_MOBILE: ["18.3", "18.2", "18.1", "18.0", "17.6", "17.5"],
  FIREFOX_MOBILE: ["134", "133", "131", "128", "125", "121"],
};

export const OS_LABELS: Record<OSName, string> = {
  WINDOWS: "Windows",
  LINUX: "Linux",
  MACOS: "macOS",
  ANDROID: "Android",
  IOS: "iOS",
};

export const BROWSER_LABELS: Record<BrowserName, string> = {
  CHROME: "Google Chrome",
  FIREFOX: "Mozilla Firefox",
  SAFARI: "Safari (macOS)",
  EDGE: "Microsoft Edge",
  CHROME_MOBILE: "Chrome Mobile",
  SAFARI_MOBILE: "Safari Mobile",
  FIREFOX_MOBILE: "Firefox Mobile",
};

export const ENGINE_MAP: Record<BrowserName, BrowserEngine> = {
  CHROME: "CHROMIUM",
  FIREFOX: "FIREFOX",
  SAFARI: "WEBKIT",
  EDGE: "CHROMIUM",
  CHROME_MOBILE: "CHROMIUM",
  SAFARI_MOBILE: "WEBKIT",
  FIREFOX_MOBILE: "FIREFOX",
};

export const VIEWPORT_PRESETS: Record<string, [number, number, number]> = {
  DESKTOP_WINDOWS: [1920, 1080, 1],
  DESKTOP_LINUX: [1920, 1080, 1],
  DESKTOP_MACOS: [2560, 1600, 2],
  MOBILE_ANDROID: [412, 915, 2.625],
  MOBILE_IOS: [390, 844, 3],
};

export const WEBGL_PRESETS: Record<string, { vendor: string; renderer: string }> = {
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
};