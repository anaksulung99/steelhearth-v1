import type { Page } from "playwright"
import type { BehaviourConfig, ClickSelector, SimulateResult, SimulateEvent } from "./types.js"
import { rand, sleep } from "../utils/random.js"

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function scrollPage(
  page: Page,
  steps: number,
  speedMin: number,
  speedMax: number,
): Promise<void> {
  for (let i = 0; i < steps; i++) {
    const amount = rand(80, 250)
    await page.evaluate((y: number) => window.scrollBy({ top: y, behavior: "smooth" }), amount)
    await sleep(rand(speedMin, speedMax))
  }
}

async function moveMouseNatural(page: Page): Promise<void> {
  const vp = page.viewportSize()
  const maxX = vp ? vp.width - 50 : 1200
  const maxY = vp ? vp.height - 50 : 700

  const x1 = rand(50, maxX)
  const y1 = rand(50, maxY)
  const x2 = rand(50, maxX)
  const y2 = rand(50, maxY)

  // Move in two steps for a more natural curve
  await page.mouse.move(x1, y1, { steps: rand(5, 15) }).catch(() => { })
  await sleep(rand(80, 200))
  await page.mouse.move(x2, y2, { steps: rand(5, 15) }).catch(() => { })
}

function normalizeClickSelector(input: ClickSelector): { selector: string; selectorType: string } {
  if (typeof input === "string") return { selector: input, selectorType: "css" }
  return { selector: input.selector, selectorType: input.selectorType ?? "css" }
}

async function tryClickSelector(page: Page, input: ClickSelector): Promise<boolean> {
  try {
    const { selector, selectorType } = normalizeClickSelector(input)
    const query = selectorType === "xpath" ? `xpath=${selector}` : selector
    const handle = selectorType === "elementId"
      ? await page.evaluateHandle((id) => document.getElementById(id), selector)
      : null
    const el = handle?.asElement() ?? await page.$(query)
    if (!el) return false
    const visible = await el.isVisible().catch(() => false)
    if (!visible) return false
    await el.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => { })
    await sleep(rand(100, 300))
    await el.click({ delay: rand(40, 180), timeout: 5000 })
    return true
  } catch {
    return false
  }
}

async function getInternalLinks(page: Page, targetOrigin: string): Promise<string[]> {
  try {
    return await page.evaluate((origin: string) => {
      const anchors = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[]
      return anchors
        .map((a) => a.href)
        .filter((href) => href.startsWith(origin) && !href.includes("#") && !href.endsWith(".pdf"))
        .slice(0, 30)
    }, targetOrigin)
  } catch {
    return []
  }
}

async function waitForPageSettle(page: Page): Promise<void> {
  // Try networkidle with a short timeout; fall back to a plain sleep
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(async () => {
    await sleep(rand(500, 1200))
  })
}

// ─── Main simulate function ───────────────────────────────────────────────────
export async function simulateBehaviour(
  page: Page,
  targetUrl: string,
  referrer: string | null,
  cfg: BehaviourConfig,
): Promise<SimulateResult> {
  const events: SimulateEvent[] = []
  const startMs = Date.now()
  let pagesVisited = 0

  let targetOrigin = "http://localhost"
  try {
    targetOrigin = new URL(targetUrl).origin
  } catch {
    // use fallback
  }

  // ── 1. Navigate to target ──────────────────────────────────────────────────
  await page.goto(targetUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
    ...(referrer ? { referer: referrer } : {}),
  })
  pagesVisited++
  events.push("NAVIGATE")

  await waitForPageSettle(page)
  await sleep(rand(600, 1400))

  // ── 2. Initial mouse movement ──────────────────────────────────────────────
  await moveMouseNatural(page)
  events.push("MOUSE_MOVE")

  // ── 3. Scroll ─────────────────────────────────────────────────────────────
  const scrollSteps = rand(cfg.minScrollCount, cfg.maxScrollCount)
  await scrollPage(page, scrollSteps, cfg.scrollSpeedMin, cfg.scrollSpeedMax)
  events.push("SCROLL")

  // ── 4. Click custom selectors ─────────────────────────────────────────────
  for (const selector of cfg.clickSelectors) {
    const clicked = await tryClickSelector(page, selector)
    if (clicked) {
      events.push("CLICK")
      await sleep(rand(1200, 3000))
      await waitForPageSettle(page)

      // If click navigated away, come back
      if (page.url() !== targetUrl) {
        pagesVisited++
        events.push("NAVIGATE")
        await sleep(rand(1500, 4000))
        await page.goBack({ timeout: 8000, waitUntil: "domcontentloaded" }).catch(() => { })
        events.push("BACK")
        await sleep(rand(600, 1200))
      }
      break
    }
  }

  // ── 5. Dwell loop ─────────────────────────────────────────────────────────
  const dwellDeadlineMs = startMs + rand(cfg.minDwellSeconds, cfg.maxDwellSeconds) * 1000
  let internalClicks = 0

  while (Date.now() < dwellDeadlineMs) {
    const remaining = dwellDeadlineMs - Date.now()
    if (remaining < 1000) break

    await moveMouseNatural(page)
    await sleep(rand(1200, 3500))

    // Occasionally scroll more
    if (Math.random() < 0.4) {
      await scrollPage(page, rand(1, 3), cfg.scrollSpeedMin, cfg.scrollSpeedMax)
    }

    // Internal navigation
    if (
      cfg.enableInternalNav &&
      internalClicks < cfg.maxInternalClicks &&
      Math.random() < 0.3
    ) {
      const links = await getInternalLinks(page, targetOrigin)
      const link = links[Math.floor(Math.random() * links.length)]
      if (link) {
        await page
          .goto(link, { waitUntil: "domcontentloaded", timeout: 15_000 })
          .catch(() => { })
        pagesVisited++
        internalClicks++
        events.push("INTERNAL_NAV")
        await waitForPageSettle(page)
        await scrollPage(page, rand(2, 5), cfg.scrollSpeedMin, cfg.scrollSpeedMax)
        await sleep(rand(2000, 6000))
      }
    }
  }

  events.push("DWELL")

  return {
    pagesVisited,
    events,
    finalUrl: page.url(),
    durationMs: Date.now() - startMs,
  }
}
