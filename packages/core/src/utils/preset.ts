import {
  VIEWPORT_PRESETS,
  WEBGL_PRESETS,
  type BrowserEngine,
  type DeviceType,
  type OSName,
  type BrowserName,
} from "../utils/types.js"

export function getViewport(deviceType: DeviceType, osName: OSName): { width: number; height: number; deviceScaleFactor: number } {
  let presetKey = `${deviceType}_${osName}`;

  if (deviceType === "DESKTOP") {
    if (osName === "WINDOWS") presetKey = "DESKTOP_WINDOWS";
    else if (osName === "LINUX") presetKey = "DESKTOP_LINUX";
    else presetKey = "DESKTOP_MACOS";
  } else {
    if (osName === "ANDROID") presetKey = "MOBILE_ANDROID";
    else presetKey = "MOBILE_IOS";
  }

  const preset = VIEWPORT_PRESETS[presetKey];
  return {
    width: preset?.[0] ?? 1366,
    height: preset?.[1] ?? 768,
    deviceScaleFactor: preset?.[2] ?? 1,
  };
}

export function getWebGLVendor(engine: BrowserEngine, osName: OSName, browserName: BrowserName): { vendor: string; renderer: string } {
  let key = `${browserName}_${osName}`;

  if (browserName === "CHROME" && osName === "WINDOWS") key = "CHROME_WINDOWS";
  else if (browserName === "CHROME" && osName === "LINUX") key = "CHROME_LINUX";
  else if (browserName === "CHROME" && osName === "MACOS") key = "CHROME_MACOS";
  else if (browserName === "CHROME_MOBILE" && osName === "ANDROID") key = "CHROME_MOBILE_ANDROID";
  else if (browserName === "SAFARI_MOBILE" && osName === "IOS") key = "SAFARI_MOBILE_IOS";
  else if (browserName === "FIREFOX" && osName === "WINDOWS") key = "FIREFOX_WINDOWS";
  else if (browserName === "FIREFOX" && osName === "LINUX") key = "FIREFOX_LINUX";
  else if (browserName === "FIREFOX" && osName === "MACOS") key = "FIREFOX_MACOS";
  else if (browserName === "SAFARI" && osName === "MACOS") key = "SAFARI_MACOS";
  else if (browserName === "EDGE" && osName === "WINDOWS") key = "EDGE_WINDOWS";

  return WEBGL_PRESETS[key] || {
    vendor: "Google Inc.",
    renderer: "ANGLE (Generic)",
  };
}

export function generateUserAgent(
  browserName: BrowserName,
  browserVersion: string,
  osName: OSName,
  osVersion: string,
  deviceType: DeviceType
): string {
  const platformMap: Record<OSName, string> = {
    WINDOWS: `Windows NT ${osVersion === "11" ? "10.0" : "10.0"}`,
    LINUX: "X11; Linux x86_64",
    MACOS: `Macintosh; Intel Mac OS X ${osVersion.replace(".", "_")}`,
    ANDROID: `Linux; Android ${osVersion}`,
    IOS: `iPhone; CPU iPhone OS ${osVersion.replace(".", "_")} like Mac OS X`,
  };

  const platform = platformMap[osName];

  const chromeVersion = browserVersion.split('.')[0];

  switch (browserName) {
    case "CHROME":
      return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion}.0.0.0 Safari/537.36`;
    case "CHROME_MOBILE":
      return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browserVersion}.0.0.0 Mobile Safari/537.36`;
    case "FIREFOX":
      return `Mozilla/5.0 (${platform}; rv:${browserVersion}.0) Gecko/20100101 Firefox/${browserVersion}.0`;
    case "FIREFOX_MOBILE":
      return `Mozilla/5.0 (Android ${osVersion}; Mobile; rv:${browserVersion}.0) Gecko/${browserVersion}.0 Firefox/${browserVersion}.0`;
    case "SAFARI":
      return `Mozilla/5.0 (${platform}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${browserVersion}.0 Safari/605.1.15`;
    case "SAFARI_MOBILE":
      return `Mozilla/5.0 (${platform}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${browserVersion}.0 Mobile/15E148 Safari/604.1`;
    case "EDGE":
      return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.0 Safari/537.36 Edg/${browserVersion}.0.0.0`;
    default:
      return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`;
  }
}