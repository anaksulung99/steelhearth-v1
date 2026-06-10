import type { Headers } from 'header-generator';

export type ScreenFingerprint = {
  availHeight: number,
  availWidth: number,
  pixelDepth: number,
  height: number,
  width: number,
  availTop: number,
  availLeft: number,
  colorDepth: number,
  innerHeight: number,
  outerHeight: number,
  outerWidth: number,
  innerWidth: number,
  screenX: number,
  pageXOffset: number,
  pageYOffset: number,
  devicePixelRatio: number,
  clientWidth: number,
  clientHeight: number,
  hasHDR: boolean;
}

export type NavigatorFingerprint = {
  userAgent: string,
  userAgentData: Record<string, string>,
  doNotTrack: string,
  appCodeName: string,
  appName: string,
  appVersion: string,
  oscpu: string,
  webdriver: string,
  language: string,
  languages: string[],
  platform: string,
  deviceMemory?: number, // Firefox does not have deviceMemory available
  hardwareConcurrency: number,
  product: string,
  productSub: string,
  vendor: string,
  vendorSub: string,
  maxTouchPoints?: number,
  extraProperties: Record<string, string>;
}

export type VideoCard = {
  renderer: string;
  vendor: string;
}

export type Fingerprint = {
  screen: ScreenFingerprint,
  navigator: NavigatorFingerprint,
  videoCodecs: Record<string, string>,
  audioCodecs: Record<string, string>,
  pluginsData: Record<string, string>,
  battery?: Record<string, string>,
  videoCard: VideoCard,
  multimediaDevices: string[],
  fonts: string[];
}

export type BrowserFingerprintWithHeaders = {
  headers: Headers,
  fingerprint: Fingerprint,
}