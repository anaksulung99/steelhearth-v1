import type { Page } from 'playwright';
import type { BehaviourConfig } from "./types.js"

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

  async simulateHumanBehaviour(): Promise<void> {
    // Navigate with realistic delay
    await this.page.goto(this.targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await this.sleep(this.random(500, 1500));

    // Scroll naturally
    await this.simulateNaturalScroll(this.page);

    // Move mouse randomly
    if (Math.random() < (this.config.mouseMoveProbability ?? 0.6)) {
      await this.simulateMouseMovement(this.page);
    }

    // Random clicks on visible elements
    if (Math.random() < (this.config.clickProbability ?? 0.3)) {
      await this.simulateRandomClick(this.page);
    }

    // Stay on page for dwell time
    await this.simulateDwellTime(this.page);
  }

  private async simulateNaturalScroll(page: Page): Promise<void> {
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

  private async simulateRandomClick(page: Page): Promise<void> {
    try {
      const clickableElements = await page.$$('a, button, [role="button"], input[type="submit"]');
      if (clickableElements.length === 0) return;

      const target = clickableElements[Math.floor(Math.random() * clickableElements.length)];
      if (!target) return

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
      }
    } catch (error) {
      // Silent fail
    }
  }

  private async simulateDwellTime(page: Page): Promise<void> {
    const startTime = Date.now();
    const dwellTimeMs = this.random(this.config.minDwellSeconds, this.config.maxDwellSeconds) * 1000;

    while (Date.now() - startTime < dwellTimeMs) {
      const remaining = dwellTimeMs - (Date.now() - startTime);
      if (remaining < 500) break;

      const action = Math.random();

      if (action < 0.4) {
        await this.simulateNaturalScroll(page);
      } else if (action < 0.6 && this.config.enableInternalNav) {
        await this.simulateInternalNavigation();
      } else if (action < 0.7) {
        await this.simulateMouseMovement(page);
      } else {
        await this.sleep(this.random(2000, 5000));
      }
    }
  }

  private async simulateInternalNavigation(): Promise<void> {
    try {
      const currentUrl = this.page.url();
      const origin = new URL(currentUrl).origin;

      const links = await this.page.$$(`a[href^="/"], a[href^="${origin}"]`);
      if (links.length === 0) return;

      const targetLink = links[Math.floor(Math.random() * links.length)];
      if (!targetLink) return;

      const href = await targetLink.getAttribute('href');

      if (href && !href.includes('#') && !href.includes('javascript:')) {
        await targetLink.click({ delay: this.random(50, 150) });
        await this.sleep(this.random(1000, 3000));
        await this.page.goBack({ timeout: 10000 }).catch(() => { });
        await this.sleep(this.random(500, 1000));
      }
    } catch (error) {
      // Silent fail
    }
  }

  async typeLikeHuman(page: Page, selector: string, text: string): Promise<void> {
    await page.click(selector);
    await this.sleep(this.random(100, 300));

    for (const char of text) {
      const minSpeed = this.config.typingSpeedMin ?? 50
      const maxSpeed = this.config.typingSpeedMax ?? 150
      await page.keyboard.type(char, { delay: this.random(minSpeed, maxSpeed) });
      if (char === ' ') {
        await this.sleep(this.random(80, 200));
      }
    }
  }
}