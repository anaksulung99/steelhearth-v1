import type { Page, ElementHandle } from 'playwright';
import type { BehaviourConfig, SimulateResult, SimulateEvent, ClickSelector } from "./types.js"
import type { BrowserCapabilities } from "../utils/types.js"

type SimulateDwellResult = "NATURAL_SCROLL" | "INTERNAL_NAVIGATION" | "MOUSE_MOVEMENT" | "DEFAUL"

export class CrawleeHumanBehaviourSimulator {
  private config: BehaviourConfig;
  private targetUrl: string
  private page: Page
  private capabilities: BrowserCapabilities | null = null;
  referrer: string | null

  constructor(
    page: Page,
    targetUrl: string,
    referrer: string | null,
    cfg: BehaviourConfig,
    capabilities?: BrowserCapabilities
  ) {
    this.page = page
    this.targetUrl = targetUrl
    this.referrer = referrer
    this.capabilities = capabilities || null;
    this.config = {
      ...cfg,
      clickProbability: 0.3,
      mouseMoveProbability: 0.6,
      typingSpeedMin: 50,
      typingSpeedMax: 150,
    };
    this.page.setDefaultTimeout(60000);
    this.page.setDefaultNavigationTimeout(60000);
  }

  private random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  private isNavigationRace(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error)
    return message.includes("Execution context was destroyed")
      || message.includes("Cannot find context")
      || message.includes("Target closed")
      || message.includes("Frame was detached")
  }

  private async queryAllSafe(page: Page, selector: string): Promise<ElementHandle[]> {
    try {
      return await page.$$(selector)
    } catch (error) {
      if (this.isNavigationRace(error)) return []
      throw error
    }
  }

  async simulateHumanBehaviour(): Promise<SimulateResult> {
    const events: SimulateEvent[] = []
    const startMs = Date.now()

    let pagesVisited = 0

    let targetOrigin = "http://localhost"

    try {
      targetOrigin = new URL(this.targetUrl).origin
    } catch {
      // use fallback
    }

    // ── 1. Navigate to target ──────────────────────────────────────────────────
    await this.page.goto(this.targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
      ...(this.referrer ? { referer: this.referrer } : {}),
    })

    pagesVisited++
    events.push("NAVIGATE")

    let capabilities = this.capabilities;
    if (!capabilities) {
      capabilities = await this.detectBrowserCapabilities(this.page);
    }

    await this.waitForPageSettle(this.page)
    await this.waitForOverlaysToDisappear(this.page).catch((error) => {
      if (!this.isNavigationRace(error)) throw error
    });
    await this.handleNotifications(this.page).catch((error) => {
      if (!this.isNavigationRace(error)) throw error
    });
    await this.sleep(this.random(500, 1500));

    // ── 2. Initial mouse movement ──────────────────────────────────────────────
    await this.simulateNaturalScroll(this.page);
    if (capabilities.isMobile) {
      await this.simulateMobileBehaviour();
    } else {
      await this.simulateDesktopBehaviour();
    }
    events.push("MOUSE_MOVE")

    // ── 3. Scroll ─────────────────────────────────────────────────────────────
    await this.simulateMouseMovement(this.page);
    events.push("SCROLL")

    // ── 4. Click custom selectors ─────────────────────────────────────────────
    if (this.config.clickSelectors.length > 0) {
      for (const selector of this.config.clickSelectors) {
        const clicked = await this.tryClickSelector(this.page, selector)
        if (clicked) {
          events.push("CLICK")
          await this.sleep(this.random(1200, 3000))
          await this.waitForPageSettle(this.page)

          // If click navigated away, come back
          if (this.page.url() !== this.targetUrl) {
            pagesVisited++
            events.push("NAVIGATE")
            await this.sleep(this.random(1500, 4000))
            await this.page.goBack({ timeout: 8000, waitUntil: "domcontentloaded" }).catch(() => { })
            events.push("BACK")
            await this.sleep(this.random(600, 1200))
          }
          break
        }
      }
    } else {
      const clicked = await this.simulateRandomClick(this.page);
      if (clicked) {
        events.push("CLICK")
        await this.sleep(this.random(1200, 3000))
        await this.waitForPageSettle(this.page)

        if (this.page.url() !== this.targetUrl) {
          pagesVisited++
          events.push("NAVIGATE")
          await this.sleep(this.random(1500, 4000))
          await this.page.goBack({ timeout: 8000, waitUntil: "domcontentloaded" }).catch(() => { })
          events.push("BACK")
          await this.sleep(this.random(600, 1200))
        }
      }
    }

    // ── 5. Dwell loop ─────────────────────────────────────────────────────────
    let internalClicks = 0
    const dwell = await this.simulateDwellTime(this.page, internalClicks);
    if (dwell === "INTERNAL_NAVIGATION") {
      pagesVisited++
      internalClicks++
      events.push("INTERNAL_NAV")
    }
    events.push("DWELL")

    return {
      pagesVisited,
      events,
      finalUrl: this.page.url(),
      durationMs: Date.now() - startMs,
    }
  }

  private async simulateNaturalScroll(page: Page): Promise<void> {
    let capabilities = this.capabilities;
    if (!capabilities) {
      capabilities = await this.detectBrowserCapabilities(this.page);
    }

    if (!capabilities.supportsWheel) {
      await this.simulateScrollWithJS(page);
      return;
    }

    await this.simulateScrollWithWheel(page);
  }

  private async simulateMouseMovement(page: Page): Promise<void> {
    let capabilities = this.capabilities;
    if (!capabilities) {
      capabilities = await this.detectBrowserCapabilities(this.page);
    }

    if (capabilities.isMobile) {
      await this.simulateTouchMovement(page);
      return;
    }

    await this.simulateMouseMovementDesktop(page);
  }

  private async simulateRandomClick(page: Page): Promise<boolean> {
    try {
      await this.waitForPageSettle(page);

      await this.waitForOverlaysToDisappear(page);

      const clickableElements = await this.queryAllSafe(page, 'a, button, [role="button"], input[type="submit"]');
      if (clickableElements.length === 0) return false;

      const validElements = [];
      for (const element of clickableElements) {
        try {
          const isVisible = await element.isVisible().catch(() => false);
          if (!isVisible) continue;

          const isIntercepted = await this.isElementIntercepted(element);
          if (!isIntercepted) {
            validElements.push(element);
          }
        } catch (error) {
          if (!this.isNavigationRace(error)) throw error
        }
      }

      if (validElements.length === 0) return false;

      const target = validElements[Math.floor(Math.random() * validElements.length)];
      if (!target) return false;

      const clicked = await this.safeClick(target);
      if (clicked) {
        await this.waitForPageSettle(page);
        return true;
      }

      return false;
    } catch (error) {
      console.log(error)
      return false
    }
  }

  private async simulateDwellTime(page: Page, currentClick: number): Promise<SimulateDwellResult> {
    const startTime = Date.now();
    const dwellTimeMs = this.random(this.config.minDwellSeconds, this.config.maxDwellSeconds) * 1000;

    let result: SimulateDwellResult = "DEFAUL";

    while (Date.now() - startTime < dwellTimeMs) {
      const remaining = dwellTimeMs - (Date.now() - startTime);
      if (remaining < 500) break;

      const isResponsive = await this.isPageInteractive(page).catch(() => false);
      if (!isResponsive) {
        await this.sleep(this.random(1000, 2000));
        result = "DEFAUL"
        continue;
      }

      const action = Math.random();

      if (action < 0.35) {
        await this.simulateNaturalScroll(page);
        result = "NATURAL_SCROLL"
      } else if (action < 0.6 && this.config.enableInternalNav && currentClick < this.config.maxInternalClicks) {
        await this.simulateInternalNavigation(page);
        result = "INTERNAL_NAVIGATION"
      } else if (action < 0.7) {
        await this.simulateMouseMovement(page);
        result = "MOUSE_MOVEMENT"
      } else {
        // Human pause - just reading
        await this.sleep(this.random(2000, 6000));
        result = "DEFAUL"
      }

      if (Math.random() < 0.2) {
        await this.waitForPageSettle(page);
        result = "DEFAUL"
      }

    }

    await this.waitForPageSettle(page);

    return result
  }

  private async simulateInternalNavigation(page: Page): Promise<void> {
    try {
      const currentUrl = this.page.url();
      const origin = new URL(currentUrl).origin;

      await this.waitForPageSettle(page);
      await this.waitForOverlaysToDisappear(page);

      // Filter links yang valid dan tidak terhalang
      const links = await this.queryAllSafe(this.page, `a[href^="/"], a[href^="${origin}"]`);
      if (links.length === 0) return;

      const validLinks = [];
      for (const link of links) {
        try {
          const isVisible = await link.isVisible().catch(() => false);
          if (!isVisible) continue;

          const href = await link.getAttribute('href');
          if (href && !href.includes('#') && !href.includes('javascript:')) {
            const isIntercepted = await this.isElementIntercepted(link);
            if (!isIntercepted) {
              validLinks.push(link);
            }
          }
        } catch (error) {
          if (!this.isNavigationRace(error)) throw error
        }
      }

      if (validLinks.length === 0) return;

      const targetLink = validLinks[Math.floor(Math.random() * validLinks.length)];
      if (!targetLink) return;

      const href = await targetLink.getAttribute('href');
      const urlBeforeClick = page.url();

      // 🔥 Gunakan safe click
      const clicked = await this.safeClick(targetLink);
      if (!clicked) return;

      await this.sleep(this.random(1000, 3000));

      // Tunggu navigation dengan timeout
      try {
        await page.waitForNavigation({
          timeout: 15000,
          waitUntil: 'domcontentloaded'
        }).catch(() => { });
      } catch (e) {
        // No navigation happened
      }

      if (page.url() !== urlBeforeClick) {
        await this.waitForPageSettle(page);
        await this.waitForOverlaysToDisappear(page);
        await this.sleep(this.random(2000, 5000));
        await this.simulateNaturalScroll(page);

        // Back navigation dengan safety
        await page.goBack({
          waitUntil: "domcontentloaded",
          timeout: 15000
        }).catch(() => {
          // Jika back gagal, reload page
          page.reload().catch(() => { });
        });

        await this.waitForPageSettle(page);
        await this.waitForOverlaysToDisappear(page);
      } else {
        await this.waitForPageSettle(page);
      }

      await this.sleep(this.random(500, 1000));
    } catch (error) {
      console.log('Internal navigation error:', error);
      try {
        await this.waitForPageSettle(page);
        await this.waitForOverlaysToDisappear(page);
      } catch {
        // Ignore recovery errors
      }
    }
  }


  async typeLikeHuman(page: Page, selector: string, text: string): Promise<void> {
    // Wait for element to be ready
    await page.waitForSelector(selector, { timeout: 5000 });
    await this.sleep(this.random(200, 500));

    await page.click(selector);
    await this.sleep(this.random(100, 300));

    for (const char of text) {
      await page.keyboard.type(char, {
        delay: this.random(this.config.typingSpeedMin ?? 50, this.config.typingSpeedMax ?? 150)
      });

      if (char === ' ') {
        await this.sleep(this.random(80, 200));
      }

      // Random pause after punctuation
      if (['.', '!', '?'].includes(char)) {
        await this.sleep(this.random(300, 800));
      }
    }

    // Wait for any auto-save or validation
    await this.sleep(this.random(500, 1000));
  }

  private async simulateScrollWithWheel(page: Page): Promise<void> {
    try {
      await page.evaluate(async () => {
        const root = document.scrollingElement || document.documentElement || document.body;
        if (!root) return;

        const totalHeight = Math.max(
          root.scrollHeight || 0,
          document.documentElement?.scrollHeight || 0,
          document.body?.scrollHeight || 0,
        );
        const viewportHeight = window.innerHeight;
        const maxScroll = totalHeight - viewportHeight;

        if (maxScroll <= 0) return;

        const scrollDistance = Math.random() * maxScroll * 0.6 + maxScroll * 0.2;
        const duration = Math.random() * 1500 + 500;

        await new Promise<void>((resolve) => {
          const startY = window.scrollY;
          const startTime = performance.now();

          const animateScroll = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / duration);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const targetY = startY + (scrollDistance - startY) * easeProgress;

            window.scrollTo(0, targetY);

            if (progress < 1) {
              requestAnimationFrame(animateScroll);
            } else {
              resolve();
            }
          };

          requestAnimationFrame(animateScroll);
        });
      });

      await this.sleep(this.random(200, 500));
    } catch (error) {
      // Fallback
      await this.simulateScrollWithJS(page);
    }
  }

  private async simulateScrollWithJS(page: Page): Promise<void> {
    try {
      const isMobile = await page.evaluate(() => /Mobile/i.test(navigator.userAgent));

      if (isMobile) {
        await page.evaluate(async () => {
          const root = document.scrollingElement || document.documentElement || document.body;
          if (!root) return;

          const totalHeight = Math.max(
            root.scrollHeight || 0,
            document.documentElement?.scrollHeight || 0,
            document.body?.scrollHeight || 0,
          );
          const viewportHeight = window.innerHeight;
          const maxScroll = totalHeight - viewportHeight;

          if (maxScroll <= 0) return;

          const scrollDistance = Math.random() * maxScroll * 0.6 + maxScroll * 0.2;

          window.scrollTo({
            top: scrollDistance,
            behavior: 'smooth'
          });

          await new Promise(resolve => setTimeout(resolve, 500));
        });
      } else {
        await page.evaluate(() => {
          window.scrollBy({
            top: window.innerHeight * 0.7,
            behavior: 'smooth'
          });
        });
      }

      await this.sleep(this.random(300, 800));
    } catch (error) {
      // Scrolling is best-effort; pages can briefly have no body during redirects.
    }
  }

  private async simulateMouseMovementDesktop(page: Page): Promise<void> {
    const viewport = page.viewportSize();
    if (!viewport) return;

    const startX = this.random(0, viewport.width);
    const startY = this.random(0, viewport.height);
    const endX = this.random(0, viewport.width);
    const endY = this.random(0, viewport.height);

    await page.mouse.move(startX, startY, { steps: this.random(5, 15) });
    await this.sleep(this.random(50, 150));

    // Gerakan acak
    const steps = this.random(10, 30);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const easeT = 1 - Math.pow(1 - t, 3);
      const x = startX + (endX - startX) * easeT;
      const y = startY + (endY - startY) * easeT;

      await page.mouse.move(x, y);
      await this.sleep(this.random(5, 15));
    }
  }

  private async simulateTouchMovement(page: Page): Promise<void> {
    const viewport = page.viewportSize();
    if (!viewport) return;

    await page.evaluate(async () => {
      const target = document.body || document.documentElement;
      if (!target) return;

      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight;
      const endX = Math.random() * window.innerWidth;
      const endY = Math.random() * window.innerHeight;

      const dispatchPointer = (type: string, x: number, y: number) => {
        const eventInit = {
          bubbles: true,
          cancelable: true,
          composed: true,
          pointerId: 1,
          pointerType: 'touch',
          isPrimary: true,
          clientX: x,
          clientY: y,
          screenX: x,
          screenY: y,
        };

        try {
          if ('PointerEvent' in window) {
            target.dispatchEvent(new PointerEvent(type, eventInit));
            return;
          }
        } catch {
          // Fall through to MouseEvent. Some WebKit builds reject PointerEvent init fields.
        }

        const mouseType = type === 'pointerdown' ? 'mousedown'
          : type === 'pointermove' ? 'mousemove'
            : type === 'pointerup' ? 'mouseup'
              : 'mousemove';
        target.dispatchEvent(new MouseEvent(mouseType, eventInit));
      };

      dispatchPointer('pointerdown', startX, startY);
      await new Promise(resolve => setTimeout(resolve, 100));
      dispatchPointer('pointermove', endX, endY);
      window.scrollBy({
        top: Math.max(80, Math.abs(endY - startY)),
        behavior: 'smooth',
      });
      await new Promise(resolve => setTimeout(resolve, 80));
      dispatchPointer('pointerup', endX, endY);
    });

    await this.sleep(this.random(200, 500));
  }

  private async simulateMobileBehaviour(): Promise<void> {
    const startTime = Date.now();
    const dwellTimeMs = this.random(this.config.minDwellSeconds, this.config.maxDwellSeconds) * 1000;

    while (Date.now() - startTime < dwellTimeMs) {
      const remaining = dwellTimeMs - (Date.now() - startTime);
      if (remaining < 500) break;

      const action = Math.random();

      if (action < 0.4) {
        await this.simulateScrollWithJS(this.page);
      } else if (action < 0.7 && this.config.enableInternalNav) {
        await this.simulateInternalNavigation(this.page);
      } else {
        await this.sleep(this.random(2000, 4000));
      }

      await this.sleep(this.random(500, 1500));
    }

    await this.waitForPageSettle(this.page);
  }

  private async simulateDesktopBehaviour(): Promise<void> {
    const startTime = Date.now();
    const dwellTimeMs = this.random(this.config.minDwellSeconds, this.config.maxDwellSeconds) * 1000;

    while (Date.now() - startTime < dwellTimeMs) {
      const remaining = dwellTimeMs - (Date.now() - startTime);
      if (remaining < 500) break;

      const isResponsive = await this.isPageInteractive(this.page).catch(() => false);
      if (!isResponsive) {
        await this.sleep(this.random(1000, 2000));
        continue;
      }

      const action = Math.random();

      if (action < 0.35) {
        await this.simulateNaturalScroll(this.page);
      } else if (action < 0.6 && this.config.enableInternalNav) {
        await this.simulateInternalNavigation(this.page);
      } else if (action < 0.7) {
        await this.simulateMouseMovementDesktop(this.page);
      } else {
        await this.sleep(this.random(2000, 6000));
      }

      if (Math.random() < 0.2) {
        await this.waitForPageSettle(this.page);
      }
    }

    await this.waitForPageSettle(this.page);
  }

  private async isPageInteractive(page: Page): Promise<boolean> {
    try {
      return await page.evaluate(() => {
        return document.readyState === 'complete' &&
          document.body !== null &&
          document.body.children.length > 0;
      });
    } catch {
      return false;
    }
  }

  private async waitForPageSettle(page: Page): Promise<void> {
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(async () => {
      await this.sleep(this.random(500, 1200))
    })
  }

  private async tryClickSelector(page: Page, input: ClickSelector): Promise<boolean> {
    try {
      const { selector, selectorType } = this.normalizeClickSelector(input)
      const query = selectorType === "xpath" ? `xpath=${selector}` : selector
      const handle = selectorType === "elementId"
        ? await page.evaluateHandle((id) => document.getElementById(id), selector)
        : null
      const el = handle?.asElement() ?? await page.$(query)
      if (!el) return false
      const visible = await el.isVisible().catch(() => false)
      if (!visible) return false
      await el.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => { })
      await this.sleep(this.random(100, 300))
      await el.click({ delay: this.random(40, 180), timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  private async waitForOverlaysToDisappear(page: Page): Promise<void> {
    const overlaySelectors = [
      '.fm-loading',
      '.loading',
      '.loader',
      '.spinner',
      '.overlay',
      '[class*="loading"]',
      '[class*="overlay"]',
      '.modal-backdrop',
      '.block-ui',
      '#loading',
      '.page-loader'
    ];

    const maxWaitMs = 15000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
      let hasOverlay = false;

      for (const selector of overlaySelectors) {
        const elements = await this.queryAllSafe(page, selector);
        for (const el of elements) {
          try {
            const isVisible = await el.isVisible().catch(() => false);
            if (isVisible) {
              hasOverlay = true;
              break;
            }
          } catch (error) {
            if (!this.isNavigationRace(error)) throw error
          }
        }
        if (hasOverlay) break;
      }

      if (!hasOverlay) break;
      await this.sleep(200);
    }
  }

  private async isElementIntercepted(element: ElementHandle): Promise<boolean> {
    try {
      const box = await element.boundingBox();
      if (!box) return true;

      // Dapatkan elemen di posisi tengah target
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      const topElement = await this.page.evaluateHandle(({ x, y }) => {
        return document.elementsFromPoint(x, y)[0] || null;
      }, { x: centerX, y: centerY });

      // Bandingkan apakah elemen teratas adalah target atau child dari target
      const isSame = await topElement.evaluate((top, targetEl) => {
        if (!top) return false;
        return top === targetEl || targetEl.contains(top);
      }, element);

      await topElement.dispose();
      return !isSame;
    } catch {
      return true;
    }
  }

  private async safeClick(element: ElementHandle): Promise<boolean> {
    try {
      // Coba normal click dulu
      await element.click({
        delay: this.random(30, 120),
        timeout: 5000
      });
      return true;
    } catch (error) {
      // Jika normal click gagal karena intercept, coba force click dengan JS
      try {
        await element.evaluate((el: HTMLElement) => {
          el.click();
          // Dispatch event juga untuk framework modern
          el.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          }));
        });
        return true;
      } catch (jsError) {
        return false;
      }
    }
  }

  private normalizeClickSelector(input: ClickSelector): { selector: string; selectorType: string } {
    if (typeof input === "string") return { selector: input, selectorType: "css" }
    return { selector: input.selector, selectorType: input.selectorType ?? "css" }
  }

  private async handleNotifications(page: Page): Promise<void> {
    const notificationSelectors = [
      '[class*="toast"]',
      '[class*="notification"]',
      '[class*="alert"]',
      '[role="alert"]',
      '[aria-label="Close"]',
      '.close',
      '.dismiss'
    ];

    for (const selector of notificationSelectors) {
      const elements = await this.queryAllSafe(page, selector);
      for (const el of elements) {
        try {
          const isVisible = await el.isVisible().catch(() => false);
          if (isVisible) {
            await el.click().catch(() => { });
            await this.sleep(200);
          }
        } catch (error) {
          if (!this.isNavigationRace(error)) throw error
        }
      }
    }
  }

  private async detectBrowserCapabilities(page: Page): Promise<BrowserCapabilities> {
    return await page.evaluate(() => {
      const userAgent = navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
      const isWebKit = /WebKit/i.test(userAgent) && !/Chrome/i.test(userAgent);
      const isFirefox = /Firefox/i.test(userAgent);
      const isChromium = /Chrome/i.test(userAgent) || /Edg/i.test(userAgent);

      return {
        supportsWheel: !isMobile,
        isMobile,
        isWebKit,
        isFirefox,
        isChromium
      };
    });
  }

}
