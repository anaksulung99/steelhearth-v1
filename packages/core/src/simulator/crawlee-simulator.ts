import type { Page } from 'playwright';
import type { BehaviourConfig, SimulateResult, SimulateEvent, ClickSelector } from "./types.js"

type SimulateDwellResult = "NATURAL_SCROLL" | "INTERNAL_NAVIGATION" | "MOUSE_MOVEMENT" | "DEFAUL"

export class CrawleeHumanBehaviourSimulator {
  private config: BehaviourConfig;
  private targetUrl: string
  private page: Page
  referrer: string | null

  constructor(
    page: Page,
    targetUrl: string,
    referrer: string | null,
    cfg: BehaviourConfig,) {
    this.page = page
    this.targetUrl = targetUrl
    this.referrer = referrer
    this.config = {
      ...cfg,
      clickProbability: 0.3,
      mouseMoveProbability: 0.6,
      typingSpeedMin: 50,
      typingSpeedMax: 150,
    };

  }

  private random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
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

    await this.waitForPageSettle(this.page)
    await this.sleep(this.random(500, 1500));

    // ── 2. Initial mouse movement ──────────────────────────────────────────────
    await this.simulateNaturalScroll(this.page);
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
    await this.waitForPageSettle(page);

    const scrollSteps = this.random(this.config.minScrollCount, this.config.maxScrollCount);

    for (let i = 0; i < scrollSteps; i++) {
      const direction = Math.random() > 0.8 ? -1 : 1;
      const amount = this.random(80, 300) * direction;

      await page.evaluate((scrollAmount) => {
        window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
      }, amount);

      await this.sleep(this.random(this.config.scrollSpeedMin, this.config.scrollSpeedMax));

      if (Math.random() < 0.2) {
        await this.sleep(this.random(500, 1500));
      }
    }
  }

  private async simulateMouseMovement(page: Page): Promise<void> {
    const viewport = page.viewportSize();
    if (!viewport) return;

    const startX = this.random(50, viewport.width - 50);
    const startY = this.random(50, viewport.height - 50);
    const endX = this.random(50, viewport.width - 50);
    const endY = this.random(50, viewport.height - 50);

    await page.mouse.move(startX, startY, { steps: this.random(5, 10) });
    await this.sleep(this.random(50, 150));

    await page.mouse.move(endX, endY, { steps: this.random(10, 20) });
    await this.sleep(this.random(100, 300));
  }

  private async simulateRandomClick(page: Page): Promise<boolean> {
    try {
      await this.waitForPageSettle(page);

      const clickableElements = await page.$$('a, button, [role="button"], input[type="submit"]');
      if (clickableElements.length === 0) return false;

      const target = clickableElements[Math.floor(Math.random() * clickableElements.length)];
      if (!target) return false

      const isVisible = await target.isVisible();

      if (isVisible) {
        await target.scrollIntoViewIfNeeded();
        await this.sleep(this.random(100, 300));

        const box = await target.boundingBox();
        if (box) {
          const clickX = box.x + box.width / 2 + this.random(-5, 5);
          const clickY = box.y + box.height / 2 + this.random(-5, 5);
          await page.mouse.move(clickX, clickY, { steps: this.random(5, 15) });
          await this.sleep(this.random(50, 100));
        }

        await target.click({ delay: this.random(30, 120) });

        await this.waitForPageSettle(page);

        return true
      }

      return false
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

      const links = await this.page.$$(`a[href^="/"], a[href^="${origin}"]`);
      if (links.length === 0) return;

      const targetLink = links[Math.floor(Math.random() * links.length)];
      if (!targetLink) return;

      const href = await targetLink.getAttribute('href');
      const linkText = await targetLink.textContent().catch(() => '');

      if (href && !href.includes('#') && !href.includes('javascript:')) {
        const urlBeforeClick = page.url();

        await targetLink.click({ delay: this.random(50, 150) });

        await this.sleep(this.random(1000, 3000));

        if (page.url() !== urlBeforeClick) {
          await this.waitForPageSettle(page);

          await this.sleep(this.random(2000, 5000));

          await this.simulateNaturalScroll(page);

          await page.goBack({
            waitUntil: "domcontentloaded",
            timeout: 15000
          }).catch(() => { });

          // Wait for the original page to settle after back navigation
          await this.waitForPageSettle(page);
        } else {
          // No navigation (maybe same page anchor or JS action)
          await this.waitForPageSettle(page);
        }

        await this.sleep(this.random(500, 1000));
      }
    } catch (error) {
      try {
        await this.waitForPageSettle(page);
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
  private normalizeClickSelector(input: ClickSelector): { selector: string; selectorType: string } {
    if (typeof input === "string") return { selector: input, selectorType: "css" }
    return { selector: input.selector, selectorType: input.selectorType ?? "css" }
  }

}