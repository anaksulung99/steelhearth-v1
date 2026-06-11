export interface BehaviourConfig {
  minDwellSeconds: number
  maxDwellSeconds: number
  minScrollCount: number
  maxScrollCount: number
  /** milliseconds between scroll steps */
  scrollSpeedMin: number
  scrollSpeedMax: number
  enableInternalNav: boolean
  maxInternalClicks: number
  /** CSS, XPath, or element id selectors to attempt clicking */
  clickSelectors: ClickSelector[]
  // Additional
  clickProbability?: number;
  mouseMoveProbability?: number;
  typingSpeedMin?: number;
  typingSpeedMax?: number;
}

export type ClickSelectorType = "css" | "xpath" | "elementId"

export type ClickSelector =
  | string
  | {
    selector: string
    selectorType?: ClickSelectorType | string
  }

export interface SimulateResult {
  pagesVisited: number
  events: SimulateEvent[]
  finalUrl: string
  durationMs: number
}

export type SimulateEvent =
  | "NAVIGATE"
  | "SCROLL"
  | "CLICK"
  | "BACK"
  | "INTERNAL_NAV"
  | "MOUSE_MOVE"
  | "DWELL"
