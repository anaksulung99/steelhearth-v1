import { BrowserController, PlaywrightCrawler, type BrowserPoolOptions } from 'crawlee';
import type { Browser, BrowserContext, Page } from 'playwright';
import { FingerprintGenerator } from 'fingerprint-generator';
import { FingerprintInjector } from 'fingerprint-injector';
import type { BrowserEngine, DeviceType } from './launch.js';


export interface FingerprintConfig {
  osName?: string;
  browserName?: string;
  deviceType?: 'desktop' | 'mobile';
  locale?: string;
  timezone?: string;
  viewport?: { width: number; height: number };
}

export interface CrawleeBrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  fingerprint: any;
  userAgent: string;
  close: () => Promise<void>;
}

export class CrawleeBrowserPool {
  private fingerprintGenerator: FingerprintGenerator;
  private fingerprintInjector: FingerprintInjector;
  private activeSessions: Map<string, CrawleeBrowserSession> = new Map();

  constructor() {
    this.fingerprintGenerator = new FingerprintGenerator();
    this.fingerprintInjector = new FingerprintInjector();
  }

  private getClientHintsScript(): string {
    return `
      // Override navigator properties
      Object.defineProperty(navigator, 'userAgentData', {
        get: () => ({
          brands: [
            { brand: 'Google Chrome', version: '131' },
            { brand: 'Chromium', version: '131' },
            { brand: 'Not?A_Brand', version: '24' }
          ],
          mobile: false,
          platform: 'Windows',
          getHighEntropyValues: async (hints) => {
            const result = {};
            if (hints.includes('architecture')) result.architecture = 'x86';
            if (hints.includes('model')) result.model = '';
            if (hints.includes('platformVersion')) result.platformVersion = '15.0.0';
            if (hints.includes('uaFullVersion')) result.uaFullVersion = '131.0.6778.86';
            if (hints.includes('bitness')) result.bitness = '64';
            if (hints.includes('fullVersionList')) result.fullVersionList = [];
            if (hints.includes('wow64')) result.wow64 = false;
            return result;
          }
        }),
        configurable: true
      });

      // Override webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      delete Object.getPrototypeOf(navigator).webdriver;

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const plugins = [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
            { name: 'Native Client', filename: 'internal-nacl-plugin' }
          ];
          plugins.length = plugins.length;
          plugins.item = (i) => plugins[i];
          plugins.namedItem = (name) => plugins.find(p => p.name === name);
          return plugins;
        }
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      
      // Override hardware concurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
      
      // Override device memory
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
      
      // Override WebGL vendor
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Intel Inc.';
        if (parameter === 37446) return 'Intel Iris OpenGL Engine';
        return getParameter(parameter);
      };

      // Canvas fingerprint noise
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
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
        return originalToDataURL.call(this, type, quality);
      };
    `;
  }

  async createSession(
    engine: BrowserEngine = 'CHROMIUM',
    fingerprintHint?: FingerprintConfig
  ): Promise<CrawleeBrowserSession> {
    const isMobile = fingerprintHint?.deviceType === 'mobile';

    const fingerprint = this.fingerprintGenerator.getFingerprint({
      devices: [isMobile ? 'mobile' : 'desktop'],
      operatingSystems: fingerprintHint?.osName ? [fingerprintHint.osName as any] : ['windows', 'macos', 'linux'],
      browsers: fingerprintHint?.browserName ? [fingerprintHint.browserName as any] :
        (engine === 'FIREFOX' ? ['firefox'] : engine === 'WEBKIT' ? ['safari'] : ['chrome']),
      locales: fingerprintHint?.locale ? [fingerprintHint.locale] : ['en-US']
    });

    const userAgent = fingerprint.fingerprint.navigator.userAgent;
    const viewport = fingerprintHint?.viewport || (isMobile ?
      { width: 390, height: 844 } : { width: 1366, height: 768 });

    const { chromium, firefox, webkit } = await import('playwright');

    let browser: Browser;

    switch (engine) {
      case 'FIREFOX':
        browser = await firefox.launch({
          headless: false,
          args: []
        });
        break;
      case 'WEBKIT':
        browser = await webkit.launch({
          headless: false,
          args: []
        });
        break;
      default:
        browser = await chromium.launch({
          headless: false,
          args: [
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
            '--disable-sync',
            '--disable-wake-on-wifi',
            '--enable-features=NetworkService,NetworkServiceInProcess',
            '--force-color-profile=srgb',
            '--metrics-recording-only',
            '--no-first-run',
            '--no-pings',
            '--no-zygote',
            '--password-store=basic',
            '--use-mock-keychain'
          ]
        });
    }

    const context = await browser.newContext({
      viewport,
      userAgent,
      isMobile,
      hasTouch: isMobile,
      locale: fingerprintHint?.locale || 'en-US',
      timezoneId: fingerprintHint?.timezone || 'America/New_York',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not?A_Brand";v="24"',
        'Sec-Ch-Ua-Mobile': isMobile ? '?1' : '?0',
        'Sec-Ch-Ua-Platform': fingerprintHint?.osName?.includes('mac') ? '"macOS"' : '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    // Inject full fingerprint
    await this.fingerprintInjector.attachFingerprintToPlaywright(context, fingerprint);

    // Add client hints and anti-detection scripts
    await context.addInitScript(this.getClientHintsScript());

    const page = await context.newPage();

    const sessionId = `session_${Date.now()}_${Math.random()}`;

    const session: CrawleeBrowserSession = {
      browser,
      context,
      page,
      fingerprint,
      userAgent,
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

  async closeAll(): Promise<void> {
    const closePromises = Array.from(this.activeSessions.values()).map(s => s.close());
    await Promise.all(closePromises);
  }
}