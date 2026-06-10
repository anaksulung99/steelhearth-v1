// Shared response envelope types from @tb/api

export interface ApiResponse<T> {
  success: true
  data: T
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}
// ──────────────────────────────────────────────────────────────────────────────
// User
// ──────────────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "USER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  license: LicenseInfo;
}


export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: "OWNER" | "ADMIN" | "USER";
}

export interface UpdateUserDto {
  name?: string | undefined;
  email?: string | undefined;
  password?: string | undefined;
  role?: "OWNER" | "ADMIN" | "USER" | undefined;
  isActive?: boolean | undefined;
}

export interface CreateUserWithLicenseDto {
  name: string;
  email: string;
  password: string;
  role: "OWNER" | "ADMIN" | "USER";
  licenseKey: string;
  expiresAt: string;
}

export interface CreateLicenseDto {
  userId: string;
  licenseKey: string;
  expiresAt: Date;
}

export interface UpdateLicenseDto {
  userId?: string | undefined;
  licenseKey?: string | undefined;
  expiresAt?: Date | undefined;
}

export interface QueryUserDto {
  page: number;
  limit: number;
  role?: "OWNER" | "ADMIN" | "USER" | undefined;
  search?: string | undefined;
}

// ──────────────────────────────────────────────────────────────────────────────
// Campaign
// ──────────────────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string
  userId: string
  name: string
  targetUrl: string
  description: string | null
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "STOPPED" | "COMPLETED" | "FAILED"
  fingerprintProfileId: string | null
  behaviourProfileId: string | null
  totalSessionsTarget: number
  dailyLimit: number
  sessionsPerHour: number
  headless: boolean
  browserEngine: "CHROMIUM" | "FIREFOX" | "WEBKIT"
  geoMode: string
  targetCountries: string[]
  createdAt: string
  updatedAt: string
  clickSelectors?: CampaignClickSelector[]
  schedules?: CampaignSchedule[]
  proxyGroups?: Array<{ id: string; proxyGroupId: string }>
}

export interface CampaignClickSelector {
  id: string
  campaignId: string
  selector: string
  selectorType: string
  description: string | null
  order: number
  createdAt: string
  updatedAt: string
}

export interface CampaignSchedule {
  id: string
  campaignId: string
  isActive: boolean
  startDate: string | null
  endDate: string | null
  daysOfWeek: number[]
  timeWindowStart: string | null
  timeWindowEnd: string | null
  timezone: string
  createdAt: string
  updatedAt: string
}

export interface CreateCampaignDto {
  name: string
  targetUrl: string
  description?: string
  proxyGroupIds?: string[]
  fingerprintProfileId?: string | null
  behaviourProfileId?: string | null
  totalSessionsTarget?: number
  dailyLimit?: number
  sessionsPerHour?: number
  headless?: boolean
  browserEngine?: string
  geoMode?: string
  targetCountries?: string[]
  clickSelectors?: Partial<CampaignClickSelector>[]
}

export type UpdateCampaignDto = Partial<CreateCampaignDto>

// ──────────────────────────────────────────────────────────────────────────────
// Proxy
// ──────────────────────────────────────────────────────────────────────────────

export interface ProxyGroup {
  id: string
  userId: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  _count?: { proxies: number }
}

export interface Proxy {
  id: string
  proxyGroupId: string
  protocol: string
  category: string
  host: string
  port: number
  username: string | null
  password: string | null
  status: "UNCHECKED" | "ACTIVE" | "DEAD" | "SLOW" | "BLOCKED"
  ip: string | null
  country: string | null
  countryCode: string | null
  latency: number | null
  createdAt: string
  updatedAt: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Behaviour Profile
// ──────────────────────────────────────────────────────────────────────────────

export interface BehaviourProfile {
  id: string
  userId: string
  name: string
  type: "DEFAULT_READER" | "MOBILE_CASUAL" | "QUICK_SCANNER" | "DEEP_ENGAGER" | "CUSTOM_CLICKER"
  minDwellSeconds: number
  maxDwellSeconds: number
  minScrollCount: number
  maxScrollCount: number
  scrollSpeedMin: number
  scrollSpeedMax: number
  enableInternalNav: boolean
  maxInternalClicks: number
  extraConfig: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  customClickSelectors?: CustomClickSelector[]
}

export interface CustomClickSelector {
  id: string
  behaviourProfileId: string
  selector: string
  selectorType: string
  description: string | null
  order: number
}

export interface CreateBehaviourDto {
  name: string
  type?: string
  minDwellSeconds?: number
  maxDwellSeconds?: number
  minScrollCount?: number
  maxScrollCount?: number
  scrollSpeedMin?: number
  scrollSpeedMax?: number
  enableInternalNav?: boolean
  maxInternalClicks?: number
  customClickSelectors?: Partial<CustomClickSelector>[]
}

export type UpdateBehaviourDto = Partial<CreateBehaviourDto>

// ──────────────────────────────────────────────────────────────────────────────
// Fingerprint Profile
// ──────────────────────────────────────────────────────────────────────────────

export interface FingerprintProfile {
  id: string
  userId: string
  name: string
  deviceType: "DESKTOP" | "MOBILE"
  osName: string
  osVersion: string | null
  browserName: string
  browserVersion: string | null
  userAgent: string | null
  language: string
  languages: string[]
  timezone: string
  locale: string
  viewportWidth: number
  viewportHeight: number
  deviceScaleFactor: number
  isMobile: boolean
  hasTouch: boolean
  canvasMode: string
  canvasSeed: number | null
  webglVendor: string | null
  webglRenderer: string | null
  hardwareConcurrency: number
  deviceMemory: number | null
  extraConfig: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Session
// ──────────────────────────────────────────────────────────────────────────────

export interface BrowserSession {
  id: string
  campaignId: string
  status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED" | "TIMEOUT"
  startedAt: string | null
  completedAt: string | null
  durationMs: number | null
  pagesVisited: number | null
  finalUrl: string | null
  errorMessage: string | null
  errorCode: string | null
  proxyId: string | null
  proxy: { host: string; port: number; countryCode: string | null } | null
  ip: string | null
  country: string | null
  countryCode: string | null
  createdAt: string
  updatedAt: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Worker
// ──────────────────────────────────────────────────────────────────────────────

export interface WorkerNode {
  id: string
  workerId: string
  hostname: string | null
  status: "ONLINE" | "BUSY" | "IDLE" | "OFFLINE" | "ERROR"
  activeJobs: number
  maxConcurrency: number
  lastHeartbeatAt: string | null
  createdAt: string
  updatedAt: string
}

// ──────────────────────────────────────────────────────────────────────────────
// System Log
// ──────────────────────────────────────────────────────────────────────────────

export interface SystemLog {
  id: string
  level: "DEBUG" | "INFO" | "WARN" | "ERROR"
  category: string
  message: string
  sessionId: string | null
  campaignId: string | null
  workerId: string | null
  createdAt: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Analytics
// ──────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  activeCampaigns: number
  totalCampaigns: number
  runningSessions: number
  queuedSessions: number
  sessionsToday: number
  successRateToday: number
  activeProxies: number
  totalProxies: number
  onlineWorkers: number
  activeJobs: number
}

export interface CampaignAnalytics {
  campaignId: string
  totalSessions: number
  successSessions: number
  failedSessions: number
  cancelledSessions: number
  runningSessions: number
  queuedSessions: number
  successRate: number
  avgDurationMs: number | null
  sessionsToday: number
  sessionsByCountry: { country: string | null; countryCode: string | null; count: number }[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────────────────────────────────────

export interface AppSetting {
  id: string
  userId: string
  key: string
  value: string
  isSecret: boolean
  createdAt: string
  updatedAt: string
}

export interface LicenseInfo {
  id: string
  userId: string
  licenseKey: string
  deviceId: string | null
  deviceName: string | null
  activatedAt: string | null
  expiresAt: string | null
  lastValidatedAt: string | null
  offlineUntil: string | null
  status: "NOT_ACTIVATED" | "ACTIVE" | "EXPIRED" | "SUSPENDED" | "DEVICE_MISMATCH" | "REVOKED"
  createdAt: string
  updatedAt: string
}

export interface LicenseUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export interface LicenseSession {
  user: LicenseUser
  license: LicenseInfo
}
