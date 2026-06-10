import type { Page } from "playwright"

interface BehaviourConfig {
  minDwellSeconds: number
  maxDwellSeconds: number
  minScrollCount: number
  maxScrollCount: number
  scrollSpeedMin: number   // ms between scroll steps
  scrollSpeedMax: number
  enableInternalNav: boolean
  maxInternalClicks: number
  clickSelectors: ClickSelector[]
}

type ClickSelector =
  | string
  | {
      selector: string
      selectorType?: string
    }

export interface SimulateResult {
  pagesVisited: number
  events: string[]
  finalUrl: string
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function doScroll(page: Page, steps: number, delayMin: number, delayMax: number): Promise<void> {
  for (let i = 0; i < steps; i++) {
    const scrollAmount = rand(80, 200)
    await page.evaluate((y: number) => window.scrollBy(0, y), scrollAmount)
    await sleep(rand(delayMin, delayMax))
  }
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
    const visible = await el.isVisible()
    if (!visible) return false
    await el.click({ delay: rand(50, 200) })
    return true
  } catch {
    return false
  }
}

async function getInternalLinks(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const origin = window.location.origin
    const links = Array.from(document.querySelectorAll("a[href]")) as HTMLAnchorElement[]
    return links
      .map((a) => a.href)
      .filter((href) => href.startsWith(origin) && !href.includes("#"))
      .slice(0, 20)
  })
}

async function moveMouseRandom(page: Page): Promise<void> {
  const x = rand(100, 1200)
  const y = rand(100, 600)
  await page.mouse.move(x, y, { steps: rand(3, 10) }).catch(() => {})
}

export async function simulateBehaviour(
  page: Page,
  targetUrl: string,
  referrer: string | null,
  cfg: BehaviourConfig,
): Promise<SimulateResult> {
  const events: string[] = []
  let pagesVisited = 0

  // Navigate to target
  await page.goto(targetUrl, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
    ...(referrer ? { referer: referrer } : {}),
  })
  pagesVisited++
  events.push("NAVIGATE")

  // Wait for page to settle
  await sleep(rand(800, 1500))

  // Mouse movement
  await moveMouseRandom(page)

  // Scroll
  const scrollSteps = rand(cfg.minScrollCount, cfg.maxScrollCount)
  await doScroll(page, scrollSteps, cfg.scrollSpeedMin, cfg.scrollSpeedMax)
  events.push("SCROLL")

  // Click custom selectors
  for (const selector of cfg.clickSelectors) {
    const clicked = await tryClickSelector(page, selector)
    if (clicked) {
      events.push("CLICK")
      await sleep(rand(1000, 2500))
      // If clicked away, come back
      if (page.url() !== targetUrl) {
        pagesVisited++
        events.push("NAVIGATE")
        await sleep(rand(1500, 3000))
        await page.goBack({ timeout: 5000 }).catch(() => {})
        events.push("BACK")
      }
      break
    }
  }

  // Dwell time on page
  const dwellMs = rand(cfg.minDwellSeconds, cfg.maxDwellSeconds) * 1000
  const dwellDeadline = Date.now() + dwellMs

  let internalClicks = 0
  while (Date.now() < dwellDeadline && internalClicks < cfg.maxInternalClicks) {
    await moveMouseRandom(page)
    await sleep(rand(1500, 3000))

    if (cfg.enableInternalNav && Math.random() < 0.25) {
      const links = await getInternalLinks(page).catch(() => [] as string[])
      const link = links[Math.floor(Math.random() * links.length)]
      if (link) {
        await page.goto(link, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => {})
        pagesVisited++
        internalClicks++
        events.push("INTERNAL_NAV")
        await doScroll(page, rand(2, 5), cfg.scrollSpeedMin, cfg.scrollSpeedMax)
        await sleep(rand(2000, 5000))
      }
    }
  }

  const finalUrl = page.url()
  return { pagesVisited, events, finalUrl }
}
