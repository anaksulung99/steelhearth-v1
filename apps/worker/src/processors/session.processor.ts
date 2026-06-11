import type { Job } from "bullmq"
import type { SessionJobData, SessionJobResult } from "../queues/session.queue.js"
import {
  loadSessionJob,
  markSessionRunning,
  markSessionSuccess,
  markSessionFailed,
  markSessionCancelled,
  markSessionQueued,
  getCampaignStatus,
  markSessionRuntimeMetadata,
  addSessionEvent,
} from "../services/session.service.js"
import { makeLogger } from "../helpers/logger.js"
import { notifySessionStatus, notifySessionProgress } from "../helpers/notifier.js"
import {
  launchBrowser,
  simulateBehaviour,
  CrawleeBrowserPool,
  CrawleeHumanBehaviourSimulator,
  pickProxy,
  formatProxy,
  buildReferrer,
  type FingerprintHint,
  type BehaviourConfig,
  type SessionBrowser,
  type SimulateResult,
  type LaunchOptions,
} from "@tb/core"
import { config } from "../config.js"

type LauncherType = "PLAYWRIGHT" | "CRAWLEE"

export async function processSession(
  job: Job<SessionJobData, SessionJobResult>
): Promise<SessionJobResult> {
  const { sessionId, campaignId } = job.data
  const log = makeLogger({ sessionId, campaignId, workerId: config.worker.id })

  const startedAt = Date.now()
  const session = await loadSessionJob(sessionId)

  async function deferOrCancelIfCampaignInactive(stage: string) {
    const status = await getCampaignStatus(campaignId)
    if (status === "ACTIVE") return null

    if (status === "STOPPED" || session.status === "CANCELLED") {
      await markSessionCancelled(sessionId)
      await notifySessionStatus(sessionId, campaignId, "CANCELLED")
      await addSessionEvent(sessionId, campaignId, "session.cancelled", { stage, campaignStatus: status })
      return { sessionId, status: "CANCELLED" as const, durationMs: Date.now() - startedAt, pagesVisited: 0 }
    }

    await markSessionQueued(sessionId)
    await addSessionEvent(sessionId, campaignId, "session.deferred", { stage, campaignStatus: status })
    return { sessionId, status: "DEFERRED" as const, durationMs: Date.now() - startedAt, pagesVisited: 0 }
  }

  if (session.status === "CANCELLED") {
    await markSessionCancelled(sessionId)
    await notifySessionStatus(sessionId, campaignId, "CANCELLED")
    return { sessionId, status: "CANCELLED", durationMs: 0, pagesVisited: 0 }
  }

  const inactiveBeforeStart = await deferOrCancelIfCampaignInactive("before_start")
  if (inactiveBeforeStart) return inactiveBeforeStart

  console.log(`[session] Starting ${sessionId} (campaign ${campaignId})`)
  await markSessionRunning(sessionId)
  await notifySessionStatus(sessionId, campaignId, "RUNNING")
  await addSessionEvent(sessionId, campaignId, "session.start")
  await job.updateProgress(5)
  await notifySessionProgress(sessionId, campaignId, 5)

  const inactiveBeforeLaunch = await deferOrCancelIfCampaignInactive("before_browser_launch")
  if (inactiveBeforeLaunch) return inactiveBeforeLaunch

  const campaign = session.campaign
  const behaviour = campaign.behaviourProfile
  const fp = campaign.fingerprintProfile

  // Build fingerprint hint from DB profile (if set)
  const fingerprintHint: FingerprintHint = fp
    ? {
      deviceType: fp.deviceType as "DESKTOP" | "MOBILE",
      osName: fp.osName,
      osVersion: fp.osVersion,
      browserName: fp.browserName,
      browserVersion: fp.browserVersion,
      userAgent: fp.userAgent,
      language: fp.language,
      timezone: fp.timezone,
      locale: fp.locale,
      viewportWidth: fp.viewportWidth,
      viewportHeight: fp.viewportHeight,
      deviceScaleFactor: fp.deviceScaleFactor,
      isMobile: fp.isMobile,
      hasTouch: fp.hasTouch,
      canvasMode: fp.canvasMode,
      canvasSeed: fp.canvasSeed,
      webglVendor: fp.webglVendor,
      webglRenderer: fp.webglRenderer,
      hardwareConcurrency: fp.hardwareConcurrency,
      deviceMemory: fp.deviceMemory,
      extraConfig: fp.extraConfig as any
    }
    : { deviceType: "DESKTOP" }

  // Collect active proxies
  const allProxies = campaign.proxyGroups.flatMap((cpg) => cpg.proxyGroup.proxies)
  const proxy = pickProxy(allProxies, "PER_SESSION")

  // Merge click selectors: campaign + behaviour, sorted by order
  const campaignSelectors = [...campaign.clickSelectors]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ selector: s.selector, selectorType: s.selectorType ?? "css" }))
  const behaviourSelectors = behaviour?.customClickSelectors
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ selector: s.selector, selectorType: s.selectorType ?? "css" })) ?? []
  const mergedSelectors = [
    ...new Map(
      [...campaignSelectors, ...behaviourSelectors].map((s) => [
        `${s.selectorType}:${s.selector}`,
        s,
      ]),
    ).values(),
  ]

  const referrer = buildReferrer("DIRECT", null, campaign.targetUrl)

  await log.info("Launching browser", {
    engine: campaign.browserEngine,
    proxy: proxy ? `${proxy.host}:${proxy.port}` : "none",
    fingerprintProfile: fp?.name ?? "generated",
  })

  let sessionBrowser: SessionBrowser | null = null
  const launcherType = (session.launcherType ?? job.data.launcherType ?? campaign.launcherType ?? "PLAYWRIGHT") as LauncherType

  const launchOpts = {
    engine: campaign.browserEngine as "CHROMIUM" | "FIREFOX" | "WEBKIT",
    headless: campaign.headless,
    ...(proxy ? { proxy: formatProxy(proxy) } : {}),
    fingerprint: fingerprintHint,
    launchTimeout: 30_000,
    navigationTimeout: 30_000,
  }
  const cfg: BehaviourConfig = {
    minDwellSeconds: behaviour?.minDwellSeconds ?? 10,
    maxDwellSeconds: behaviour?.maxDwellSeconds ?? 60,
    minScrollCount: behaviour?.minScrollCount ?? 2,
    maxScrollCount: behaviour?.maxScrollCount ?? 8,
    scrollSpeedMin: behaviour?.scrollSpeedMin ?? 100,
    scrollSpeedMax: behaviour?.scrollSpeedMax ?? 500,
    enableInternalNav: behaviour?.enableInternalNav ?? false,
    maxInternalClicks: behaviour?.maxInternalClicks ?? 0,
    clickSelectors: mergedSelectors,
  }

  let result: SessionJobResult

  try {
    sessionBrowser = await launchSessionBrowser(launcherType, launchOpts)

    const proxyMeta = proxy as (typeof proxy & {
      ip?: string | null
      country?: string | null
      countryCode?: string | null
      city?: string | null
    })

    await markSessionRuntimeMetadata(sessionId, {
      fingerprintProfileId: campaign.fingerprintProfileId,
      behaviourProfileId: campaign.behaviourProfileId,
      ...(proxyMeta
        ? {
          proxyId: proxyMeta.id,
          ip: proxyMeta.ip,
          country: proxyMeta.country,
          countryCode: proxyMeta.countryCode,
          city: proxyMeta.city,
        }
        : {}),
      userAgent: sessionBrowser.userAgent,
    })

    await addSessionEvent(sessionId, campaignId, "session.browser_launched", {
      launcherType,
      engine: campaign.browserEngine,
      ua: sessionBrowser.userAgent,
      timezone: sessionBrowser.timezone,
    })
    await job.updateProgress(20)
    await notifySessionProgress(sessionId, campaignId, 20)

    const page = await sessionBrowser.context.newPage()



    await job.updateProgress(30)
    await notifySessionProgress(sessionId, campaignId, 30)

    let simResult: SimulateResult
    switch (launcherType) {
      case "PLAYWRIGHT":
        simResult = await simulateBehaviour(page, campaign.targetUrl, referrer, cfg)
        break
      case "CRAWLEE":
        const crawleeSimulation = new CrawleeHumanBehaviourSimulator(page, campaign.targetUrl, referrer, cfg)
        simResult = await crawleeSimulation.simulateHumanBehaviour()
        break
      default:
        simResult = await simulateBehaviour(page, campaign.targetUrl, referrer, cfg)
    }

    await job.updateProgress(90)
    await notifySessionProgress(sessionId, campaignId, 90)

    for (const eventType of simResult.events) {
      await addSessionEvent(sessionId, campaignId, `session.${eventType.toLowerCase()}`)
    }

    const durationMs = simResult.durationMs
    const pagesVisited = simResult.pagesVisited
    const finalUrl = simResult.finalUrl !== campaign.targetUrl ? simResult.finalUrl : undefined
    await markSessionSuccess(sessionId, {
      durationMs,
      pagesVisited,
      ...(proxy ? { proxyId: proxy.id } : {}),
      ...(finalUrl ? { finalUrl } : {}),
    })
    await notifySessionStatus(sessionId, campaignId, "SUCCESS", { durationMs, pagesVisited })
    console.log(`[session] SUCCESS ${sessionId} — ${pagesVisited} pages, ${durationMs}ms`)

    await job.updateProgress(100)
    await notifySessionProgress(sessionId, campaignId, 100)
    await log.info("Session completed", { durationMs, pagesVisited })

    result = {
      sessionId,
      status: "COMPLETED",
      durationMs,
      pagesVisited,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[session] FAILED ${sessionId}:`, message)
    await markSessionFailed(sessionId, message)
    await notifySessionStatus(sessionId, campaignId, "FAILED", { error: message })
    await addSessionEvent(sessionId, campaignId, "session.error", { error: message })
    await log.error("Session failed", { error: message })

    result = {
      sessionId,
      status: "FAILED",
      durationMs: Date.now() - startedAt,
      pagesVisited: 0,
      error: message,
    }
  } finally {
    await sessionBrowser?.close()
  }

  return result
}

async function launchSessionBrowser(
  launcherType: LauncherType,
  opts: LaunchOptions,
): Promise<SessionBrowser> {
  if (launcherType === "CRAWLEE") {
    const browserPool = new CrawleeBrowserPool(opts)
    const sessionBrowser = await browserPool.launchBrowser()
    return {
      ...sessionBrowser,
      close: async () => {
        await sessionBrowser.close()
        await browserPool.closeAll()
      },
    }
  }

  return launchBrowser(opts)
}
