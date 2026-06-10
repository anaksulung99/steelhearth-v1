-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'STOPPED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCESS', 'FAILED', 'CANCELLED', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "ProxyStatus" AS ENUM ('UNCHECKED', 'ACTIVE', 'DEAD', 'SLOW', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ProxyProtocol" AS ENUM ('HTTP', 'HTTPS', 'SOCKS4', 'SOCKS5');

-- CreateEnum
CREATE TYPE "ProxyCategory" AS ENUM ('RESIDENTIAL', 'MOBILE', 'DATACENTER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "BehaviourType" AS ENUM ('DEFAULT_READER', 'MOBILE_CASUAL', 'QUICK_SCANNER', 'DEEP_ENGAGER', 'CUSTOM_CLICKER');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('DESKTOP', 'MOBILE');

-- CreateEnum
CREATE TYPE "OsName" AS ENUM ('WINDOWS', 'LINUX', 'MACOS', 'ANDROID', 'IOS');

-- CreateEnum
CREATE TYPE "BrowserName" AS ENUM ('CHROME', 'FIREFOX', 'SAFARI', 'EDGE', 'CHROME_MOBILE', 'SAFARI_MOBILE', 'FIREFOX_MOBILE');

-- CreateEnum
CREATE TYPE "BrowserEngine" AS ENUM ('CHROMIUM', 'FIREFOX', 'WEBKIT');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('NOT_ACTIVATED', 'ACTIVE', 'EXPIRED', 'SUSPENDED', 'DEVICE_MISMATCH', 'REVOKED');

-- CreateEnum
CREATE TYPE "WorkerStatus" AS ENUM ('ONLINE', 'BUSY', 'IDLE', 'OFFLINE', 'ERROR');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "LogCategory" AS ENUM ('SYSTEM', 'WORKER', 'SESSION', 'PROXY', 'API', 'SECURITY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseKey" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceName" TEXT,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "lastValidatedAt" TIMESTAMP(3),
    "offlineUntil" TIMESTAMP(3),
    "status" "LicenseStatus" NOT NULL DEFAULT 'NOT_ACTIVATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "fingerprintProfileId" TEXT,
    "behaviourProfileId" TEXT,
    "totalSessionsTarget" INTEGER NOT NULL DEFAULT 0,
    "dailyLimit" INTEGER NOT NULL DEFAULT 100,
    "sessionsPerHour" INTEGER NOT NULL DEFAULT 10,
    "headless" BOOLEAN NOT NULL DEFAULT true,
    "browserEngine" "BrowserEngine" NOT NULL DEFAULT 'CHROMIUM',
    "geoMode" TEXT NOT NULL DEFAULT 'proxy',
    "targetCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_schedules" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6]::INTEGER[],
    "timeWindowStart" TEXT,
    "timeWindowEnd" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fingerprint_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deviceType" "DeviceType" NOT NULL DEFAULT 'DESKTOP',
    "osName" "OsName" NOT NULL DEFAULT 'WINDOWS',
    "osVersion" TEXT,
    "browserName" "BrowserName" NOT NULL DEFAULT 'CHROME',
    "browserVersion" TEXT,
    "userAgent" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en-US',
    "languages" TEXT[] DEFAULT ARRAY['en-US', 'en']::TEXT[],
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "viewportWidth" INTEGER NOT NULL DEFAULT 1280,
    "viewportHeight" INTEGER NOT NULL DEFAULT 720,
    "deviceScaleFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isMobile" BOOLEAN NOT NULL DEFAULT false,
    "hasTouch" BOOLEAN NOT NULL DEFAULT false,
    "canvasMode" TEXT NOT NULL DEFAULT 'noise',
    "canvasSeed" INTEGER,
    "webglVendor" TEXT,
    "webglRenderer" TEXT,
    "hardwareConcurrency" INTEGER NOT NULL DEFAULT 4,
    "deviceMemory" INTEGER,
    "extraConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fingerprint_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxy_groups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proxy_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proxies" (
    "id" TEXT NOT NULL,
    "proxyGroupId" TEXT NOT NULL,
    "protocol" "ProxyProtocol" NOT NULL DEFAULT 'HTTP',
    "category" "ProxyCategory" NOT NULL DEFAULT 'UNKNOWN',
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "username" TEXT,
    "password" TEXT,
    "status" "ProxyStatus" NOT NULL DEFAULT 'UNCHECKED',
    "ip" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "region" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "isp" TEXT,
    "asn" TEXT,
    "latency" INTEGER,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "lastCheckedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "raw" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proxies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_proxy_groups" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "proxyGroupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_proxy_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behaviour_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BehaviourType" NOT NULL DEFAULT 'DEFAULT_READER',
    "minDwellSeconds" INTEGER NOT NULL DEFAULT 10,
    "maxDwellSeconds" INTEGER NOT NULL DEFAULT 60,
    "minScrollCount" INTEGER NOT NULL DEFAULT 2,
    "maxScrollCount" INTEGER NOT NULL DEFAULT 8,
    "scrollSpeedMin" INTEGER NOT NULL DEFAULT 100,
    "scrollSpeedMax" INTEGER NOT NULL DEFAULT 500,
    "enableInternalNav" BOOLEAN NOT NULL DEFAULT false,
    "maxInternalClicks" INTEGER NOT NULL DEFAULT 0,
    "extraConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "behaviour_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_click_selectors" (
    "id" TEXT NOT NULL,
    "behaviourProfileId" TEXT NOT NULL,
    "selector" TEXT NOT NULL,
    "selectorType" TEXT NOT NULL DEFAULT 'css',
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_click_selectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "browser_sessions" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fingerprintProfileId" TEXT,
    "behaviourProfileId" TEXT,
    "proxyId" TEXT,
    "workerNodeId" TEXT,
    "targetUrl" TEXT NOT NULL,
    "finalUrl" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "ip" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "city" TEXT,
    "userAgent" TEXT,
    "httpStatus" INTEGER,
    "pageTitle" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "browser_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_events" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_nodes" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "hostname" TEXT,
    "region" TEXT,
    "status" "WorkerStatus" NOT NULL DEFAULT 'OFFLINE',
    "activeJobs" INTEGER NOT NULL DEFAULT 0,
    "maxConcurrency" INTEGER NOT NULL DEFAULT 3,
    "lastHeartbeatAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "category" "LogCategory" NOT NULL DEFAULT 'SYSTEM',
    "message" TEXT NOT NULL,
    "data" JSONB,
    "sessionId" TEXT,
    "campaignId" TEXT,
    "workerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_userId_key" ON "licenses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_licenseKey_key" ON "licenses"("licenseKey");

-- CreateIndex
CREATE INDEX "campaigns_userId_idx" ON "campaigns"("userId");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaign_schedules_campaignId_idx" ON "campaign_schedules"("campaignId");

-- CreateIndex
CREATE INDEX "fingerprint_profiles_userId_idx" ON "fingerprint_profiles"("userId");

-- CreateIndex
CREATE INDEX "proxy_groups_userId_idx" ON "proxy_groups"("userId");

-- CreateIndex
CREATE INDEX "proxies_proxyGroupId_idx" ON "proxies"("proxyGroupId");

-- CreateIndex
CREATE INDEX "proxies_status_idx" ON "proxies"("status");

-- CreateIndex
CREATE INDEX "proxies_country_idx" ON "proxies"("country");

-- CreateIndex
CREATE UNIQUE INDEX "proxies_proxyGroupId_host_port_key" ON "proxies"("proxyGroupId", "host", "port");

-- CreateIndex
CREATE INDEX "campaign_proxy_groups_campaignId_idx" ON "campaign_proxy_groups"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_proxy_groups_campaignId_proxyGroupId_key" ON "campaign_proxy_groups"("campaignId", "proxyGroupId");

-- CreateIndex
CREATE INDEX "behaviour_profiles_userId_idx" ON "behaviour_profiles"("userId");

-- CreateIndex
CREATE INDEX "custom_click_selectors_behaviourProfileId_idx" ON "custom_click_selectors"("behaviourProfileId");

-- CreateIndex
CREATE INDEX "browser_sessions_campaignId_idx" ON "browser_sessions"("campaignId");

-- CreateIndex
CREATE INDEX "browser_sessions_status_idx" ON "browser_sessions"("status");

-- CreateIndex
CREATE INDEX "browser_sessions_startedAt_idx" ON "browser_sessions"("startedAt");

-- CreateIndex
CREATE INDEX "browser_sessions_proxyId_idx" ON "browser_sessions"("proxyId");

-- CreateIndex
CREATE INDEX "session_events_sessionId_idx" ON "session_events"("sessionId");

-- CreateIndex
CREATE INDEX "session_events_campaignId_idx" ON "session_events"("campaignId");

-- CreateIndex
CREATE INDEX "session_events_eventType_idx" ON "session_events"("eventType");

-- CreateIndex
CREATE INDEX "session_events_createdAt_idx" ON "session_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "worker_nodes_workerId_key" ON "worker_nodes"("workerId");

-- CreateIndex
CREATE INDEX "worker_nodes_status_idx" ON "worker_nodes"("status");

-- CreateIndex
CREATE INDEX "worker_nodes_lastHeartbeatAt_idx" ON "worker_nodes"("lastHeartbeatAt");

-- CreateIndex
CREATE INDEX "system_logs_level_idx" ON "system_logs"("level");

-- CreateIndex
CREATE INDEX "system_logs_category_idx" ON "system_logs"("category");

-- CreateIndex
CREATE INDEX "system_logs_campaignId_idx" ON "system_logs"("campaignId");

-- CreateIndex
CREATE INDEX "system_logs_sessionId_idx" ON "system_logs"("sessionId");

-- CreateIndex
CREATE INDEX "system_logs_createdAt_idx" ON "system_logs"("createdAt");

-- CreateIndex
CREATE INDEX "app_settings_userId_idx" ON "app_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "app_settings_userId_key_key" ON "app_settings"("userId", "key");

-- AddForeignKey
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_fingerprintProfileId_fkey" FOREIGN KEY ("fingerprintProfileId") REFERENCES "fingerprint_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_behaviourProfileId_fkey" FOREIGN KEY ("behaviourProfileId") REFERENCES "behaviour_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_schedules" ADD CONSTRAINT "campaign_schedules_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fingerprint_profiles" ADD CONSTRAINT "fingerprint_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proxy_groups" ADD CONSTRAINT "proxy_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proxies" ADD CONSTRAINT "proxies_proxyGroupId_fkey" FOREIGN KEY ("proxyGroupId") REFERENCES "proxy_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_proxy_groups" ADD CONSTRAINT "campaign_proxy_groups_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_proxy_groups" ADD CONSTRAINT "campaign_proxy_groups_proxyGroupId_fkey" FOREIGN KEY ("proxyGroupId") REFERENCES "proxy_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behaviour_profiles" ADD CONSTRAINT "behaviour_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_click_selectors" ADD CONSTRAINT "custom_click_selectors_behaviourProfileId_fkey" FOREIGN KEY ("behaviourProfileId") REFERENCES "behaviour_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "browser_sessions" ADD CONSTRAINT "browser_sessions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "browser_sessions" ADD CONSTRAINT "browser_sessions_fingerprintProfileId_fkey" FOREIGN KEY ("fingerprintProfileId") REFERENCES "fingerprint_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "browser_sessions" ADD CONSTRAINT "browser_sessions_behaviourProfileId_fkey" FOREIGN KEY ("behaviourProfileId") REFERENCES "behaviour_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "browser_sessions" ADD CONSTRAINT "browser_sessions_proxyId_fkey" FOREIGN KEY ("proxyId") REFERENCES "proxies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "browser_sessions" ADD CONSTRAINT "browser_sessions_workerNodeId_fkey" FOREIGN KEY ("workerNodeId") REFERENCES "worker_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_events" ADD CONSTRAINT "session_events_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "browser_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
