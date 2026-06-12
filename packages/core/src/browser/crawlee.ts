import {
  chromium,
  firefox,
  webkit,
  type BrowserType,
} from "playwright"
import { FingerprintGenerator } from 'fingerprint-generator';
import { FingerprintInjector } from 'fingerprint-injector';
import {
  type LaunchOptions,
  type SessionBrowser,
  type FingerprintHint,
} from './launch.js';
import {
  type BrowserEngine,
  type BrowserName,
  type OSName,
} from "../utils/types.js"
import { getWebGLVendor } from "../utils/preset.js"


export class CrawleeBrowserPool {
  private fingerprintGenerator: FingerprintGenerator;
  private fingerprintInjector: FingerprintInjector;
  private activeSessions: Map<string, SessionBrowser> = new Map();
  private options: LaunchOptions

  constructor(options: LaunchOptions) {
    this.options = options
    this.fingerprintGenerator = new FingerprintGenerator();
    this.fingerprintInjector = new FingerprintInjector();
  }

  async launchBrowser(): Promise<SessionBrowser> {
    const hint = this.options.fingerprint as FingerprintHint

    const isMobile = hint?.isMobile || hint?.deviceType === "MOBILE" || this.isMobileDeviceFromFingerprint(hint);
    const isWebKit = this.options.engine === "WEBKIT"

    const browserVersion = hint.browserVersion;

    const fingerprint = this.fingerprintGenerator.getFingerprint({
      devices: [isMobile ? 'mobile' : 'desktop'],
      operatingSystems: this.resolveOs(hint.osName) as any,
      browsers: this.resolveBrowser(this.options.engine, hint.browserName) as any,
      locales: hint.language ? [hint.language] : ["en-US", "en-GB"],
    });

    const userAgent = hint.userAgent || (fingerprint as any).navigator?.userAgent || fingerprint.headers["user-agent"] || ""
    const timezone = hint.timezone || "America/New_York"
    const viewport = {
      width: hint.viewportWidth || (isMobile ? 390 : 1366),
      height: hint.viewportHeight || (isMobile ? 844 : 768),
    }

    const launcher = this.engineLauncher(this.options.engine)

    const browser = await launcher.launch({
      headless: this.options.headless ?? true,
      timeout: this.options.launchTimeout ?? 30_000,
      args: this.options.engine === "CHROMIUM" ? this.getBrowserArgs(this.options.engine, hint) : [],
    });

    const extraHTTPHeaders: Record<string, string> = {
      "Accept-Language": fingerprint.headers["accept-language"] ?? "en-US,en;q=0.9",
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    }

    if (this.options.engine === "CHROMIUM") {
      const majorVersion = browserVersion?.split('.')[0] ?? "120"
      extraHTTPHeaders['Sec-Ch-Ua'] = `"Google Chrome";v="${majorVersion}", "Chromium";v="${majorVersion}", "Not?A_Brand";v="24"`
      extraHTTPHeaders['Sec-Ch-Ua-Mobile'] = isMobile ? '?1' : '?0'
      extraHTTPHeaders['Sec-Ch-Ua-Platform'] = this.getSecChUaPlatform(hint.osName as OSName)
    }

    const context = await browser.newContext({
      viewport,
      userAgent,
      isMobile,
      hasTouch: isMobile,
      locale: hint.language ?? "en-US",
      timezoneId: timezone,
      extraHTTPHeaders,
      ...(this.options.proxy ? { proxy: this.options.proxy } : {}),
    });

    await this.fingerprintInjector.attachFingerprintToPlaywright(context, fingerprint).catch(() => { });

    await context.addInitScript(this.getClientHintsScript(hint, this.options.engine));

    const page = await context.newPage();

    if (this.options.navigationTimeout) {
      context.setDefaultNavigationTimeout(this.options.navigationTimeout)
    }

    const sessionId = `session_${Date.now()}_${Math.random()}`;
    const supportsWheel = !isMobile

    const session: SessionBrowser = {
      browser,
      context,
      timezone,
      userAgent,
      isMobile,
      capabilities: {
        supportsWheel,
        isMobile,
        isWebKit,
      },
      close: async () => {
        await page.close().catch(() => { });
        await context.close().catch(() => { });
        await browser.close().catch(() => { });
        this.activeSessions.delete(sessionId);
      }
    };

    this.activeSessions.set(sessionId, session);
    return session
  }

  private getClientHintsScript(hint: FingerprintHint, engine: BrowserEngine): string {
    const isMobile = hint.isMobile ?? hint.deviceType === "MOBILE"
    const browserVersion = hint.browserVersion;
    const chromeVersion = browserVersion?.split('.')[0];
    const browsserName = hint.browserName ?? "CHROME"
    const osName = hint.osName ?? "WINDOWS"
    const osPlatform = this.getSecChUaPlatform(hint.osName as OSName).replace(/"/g, "")
    const userAgentDataScript = engine === "CHROMIUM" ? `
      try {
        Object.defineProperty(navigator, 'userAgentData', {
          get: () => ({
            brands: [
              { brand: 'Google Chrome', version: '${chromeVersion ?? "120"}' },
              { brand: 'Chromium', version: '${chromeVersion ?? "120"}' },
              { brand: 'Not?A_Brand', version: '24' }
            ],
            mobile: ${isMobile},
            platform: '${osPlatform}',
            getHighEntropyValues: async (hints) => {
              const result = {};
              if (hints.includes('architecture')) result.architecture = 'x86';
              if (hints.includes('model')) result.model = '';
              if (hints.includes('platformVersion')) result.platformVersion = '${hint.osVersion ?? ""}';
              if (hints.includes('uaFullVersion')) result.uaFullVersion = '${browserVersion ?? chromeVersion ?? "120"}';
              if (hints.includes('bitness')) result.bitness = '64';
              if (hints.includes('fullVersionList')) result.fullVersionList = [];
              if (hints.includes('wow64')) result.wow64 = false;
              return result;
            }
          }),
          configurable: true
        });
      } catch(e) {}
    ` : ""

    return `
      ${userAgentDataScript}

      // Override webdriver
      try { Object.defineProperty(navigator, 'webdriver', { get: () => undefined, configurable: true }); } catch(e) {}
      try { delete Object.getPrototypeOf(navigator).webdriver; } catch(e) {}

      // Override plugins
      try {
        Object.defineProperty(navigator, 'plugins', {
          get: () => {
            const plugins = [
              { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
              { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
              { name: 'Native Client', filename: 'internal-nacl-plugin' }
            ];
            plugins.item = (i) => plugins[i];
            plugins.namedItem = (name) => plugins.find(p => p.name === name);
            return plugins;
          },
          configurable: true
        });
      } catch(e) {}

      // Override languages
      try { Object.defineProperty(navigator, 'languages', { get: () => ['${hint.locale ?? hint.language ?? "en-US"}', 'en'], configurable: true }); } catch(e) {}
      
      // Override hardware concurrency
      try { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8, configurable: true }); } catch(e) {}
      
      // Override device memory
      try { Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true }); } catch(e) {}
      
      // Override WebGL vendor
      try {
        if (typeof WebGLRenderingContext !== 'undefined') {
          const webglVendor = ${JSON.stringify(getWebGLVendor(engine, osName as OSName, browsserName as BrowserName))};
          const getParameter = WebGLRenderingContext.prototype.getParameter;
          WebGLRenderingContext.prototype.getParameter = function(parameter) {
            if (parameter === 37445) return webglVendor.vendor;
            if (parameter === 37446) return webglVendor.renderer;
            return getParameter.call(this, parameter);
          };
        }
      } catch(e) {}

      // Canvas fingerprint noise
      try {
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
          try {
            if (this.width > 0 && this.height > 0) {
              const ctx = this.getContext('2d');
              if (ctx) {
                const imageData = ctx.getImageData(0, 0, this.width, this.height);
                for (let i = 0; i < imageData.data.length; i += 4) {
                  if (Math.random() < 0.01) {
                    imageData.data[i] = imageData.data[i] ^ (Math.random() * 4);
                  }
                }
                ctx.putImageData(imageData, 0, 0);
              }
            }
          } catch(e) {}
          return originalToDataURL.call(this, type, quality);
        };
      } catch(e) {}
    `;
  }

  private getBrowserArgs(engine: BrowserEngine, hint: FingerprintHint): string[] {
    const isMobile = hint.deviceType === "MOBILE";
    const commonArgs = [
      '--no-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-web-security',
      '--disable-features=BlockInsecurePrivateNetworkRequests',
      '--disable-features=PasswordImport',
      '--disable-sync',
      '--disable-default-apps',
      '--disable-translate',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-component-update',
      '--disable-domain-reliability',
      '--disable-features=AudioServiceOutOfProcess',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-notifications',
      '--disable-offer-store-unmasked-wallet-cards',
      '--disable-popup-blocking',
      '--disable-print-preview',
      '--disable-prompt-on-repost',
      '--disable-renderer-backgrounding',
      '--disable-setuid-sandbox',
      '--disable-speech-api',
      '--disable-wake-on-wifi',
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--force-color-profile=srgb',
      '--metrics-recording-only',
      '--no-first-run',
      '--no-pings',
      '--no-zygote',
      '--password-store=basic',
      '--use-mock-keychain'
    ];

    if (engine === "CHROMIUM") {
      return commonArgs;
    }

    return [];
  }

  private getSecChUaPlatform(osName?: OSName): string {
    switch (osName) {
      case "WINDOWS": return '"Windows"';
      case "MACOS": return '"macOS"';
      case "LINUX": return '"Linux"';
      case "ANDROID": return '"Android"';
      case "IOS": return '"iOS"';
      default: return '"Windows"';
    }
  }

  engineLauncher(engine: BrowserEngine): BrowserType {
    if (engine === "FIREFOX") return firefox
    if (engine === "WEBKIT") return webkit
    return chromium
  }

  resolveOs(osName?: string): string[] {
    if (!osName) return ["windows", "macos", "linux"]
    const n = osName.toLowerCase()
    if (n.includes("windows")) return ["windows"]
    if (n.includes("mac") || n.includes("darwin")) return ["macos"]
    if (n.includes("android")) return ["android"]
    if (n.includes("ios")) return ["ios"]
    return ["linux"]
  }

  resolveBrowser(engine: BrowserEngine, browserName?: string): string[] {
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

  resolveBrowserEngine(browserName?: BrowserName): BrowserEngine {
    switch (browserName) {
      case "CHROME":
      case "CHROME_MOBILE":
      case "EDGE":
        return "CHROMIUM"
      case "FIREFOX":
      case "FIREFOX_MOBILE":
        return "FIREFOX"
      case "SAFARI":
      case "SAFARI_MOBILE":
        return "WEBKIT"
      default:
        return "CHROMIUM"
    }
  }

  private isMobileDeviceFromFingerprint(fingerprint: any): boolean {
    return fingerprint?.navigator?.userAgent?.includes('Mobile') ||
      fingerprint?.navigator?.userAgent?.includes('Android') ||
      fingerprint?.navigator?.userAgent?.includes('iPhone');
  }

  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.activeSessions.values()).map(s => s.close());
    await Promise.all(closePromises);
  }
}
