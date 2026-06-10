import { prisma } from "@tb/database"
import type {
  CreateProxyGroupDto, UpdateProxyGroupDto,
  BulkImportProxyDto, UpdateProxyDto, QueryProxyDto,
} from "@tb/contracts"
import { checkProxy, checkProxies, resolveProxyStatus } from "@tb/core"
import type { ProxyCheckResult } from "@tb/core"
import { notFound } from "../helpers/errors.js"
import { clean } from "../helpers/prisma.js"
import { parsePagination } from "../helpers/pagination.js"

// -----------------------------------------------------------------------
// Proxy Groups
// -----------------------------------------------------------------------

export async function listProxyGroups(userId: string) {
  return prisma.proxyGroup.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { proxies: true } } },
  })
}

export async function getProxyGroup(userId: string, id: string) {
  const group = await prisma.proxyGroup.findFirst({
    where: { id, userId },
    include: { _count: { select: { proxies: true } } },
  })
  if (!group) throw notFound("Proxy group")
  return group
}

export async function createProxyGroup(userId: string, dto: CreateProxyGroupDto) {
  return prisma.proxyGroup.create({ data: clean({ ...dto, userId }) })
}

export async function updateProxyGroup(userId: string, id: string, dto: UpdateProxyGroupDto) {
  const group = await prisma.proxyGroup.findFirst({ where: { id, userId } })
  if (!group) throw notFound("Proxy group")
  return prisma.proxyGroup.update({ where: { id }, data: clean(dto) })
}

export async function deleteProxyGroup(userId: string, id: string) {
  const group = await prisma.proxyGroup.findFirst({ where: { id, userId } })
  if (!group) throw notFound("Proxy group")
  await prisma.proxyGroup.delete({ where: { id } })
}

// -----------------------------------------------------------------------
// Proxies
// -----------------------------------------------------------------------

export async function listProxies(userId: string, query: QueryProxyDto) {
  const { page, limit, skip } = parsePagination(query)

  // Verify group ownership if filtering by group
  if (query.proxyGroupId) {
    const group = await prisma.proxyGroup.findFirst({ where: { id: query.proxyGroupId, userId } })
    if (!group) throw notFound("Proxy group")
  }

  const where = {
    proxyGroup: { userId },
    ...(query.proxyGroupId ? { proxyGroupId: query.proxyGroupId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.protocol ? { protocol: query.protocol } : {}),
    ...(query.country ? { countryCode: query.country.toUpperCase() } : {}),
    ...(query.search
      ? { OR: [{ host: { contains: query.search } }, { ip: { contains: query.search } }] }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.proxy.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.proxy.count({ where }),
  ])
  return { data, total, page, limit }
}

export async function getProxy(userId: string, id: string) {
  const proxy = await prisma.proxy.findFirst({
    where: { id, proxyGroup: { userId } },
  })
  if (!proxy) throw notFound("Proxy")
  return proxy
}

// -----------------------------------------------------------------------
// Parse supported proxy formats:
// - protocol://[user:pass@]host:port
// - host:port
// - host:port:user:pass
// -----------------------------------------------------------------------

interface ParsedProxy {
  protocol: "HTTP" | "HTTPS" | "SOCKS4" | "SOCKS5"
  host: string
  port: number
  username: string | undefined
  password: string | undefined
}

function parseProxyLine(raw: string): ParsedProxy | null {
  const line = raw.trim()
  if (!line) return null

  const fallbackProtocol = "HTTP" as const

  if (line.includes("://")) {
    try {
      const url = new URL(line)
      const scheme = url.protocol.replace(":", "").toUpperCase()
      const protocol = (
        scheme === "HTTP" ? "HTTP"
        : scheme === "HTTPS" ? "HTTPS"
        : scheme === "SOCKS4" ? "SOCKS4"
        : scheme === "SOCKS5" ? "SOCKS5"
        : null
      ) as "HTTP" | "HTTPS" | "SOCKS4" | "SOCKS5" | null
      if (!protocol) return null
      const port = parseInt(url.port, 10)
      if (!url.hostname || !Number.isInteger(port) || port < 1 || port > 65535) return null

      return {
        protocol,
        host: url.hostname,
        port,
        username: url.username ? decodeURIComponent(url.username) : undefined,
        password: url.password ? decodeURIComponent(url.password) : undefined,
      }
    } catch {
      return null
    }
  }

  const parts = line.split(":")
  if (parts.length !== 2 && parts.length !== 4) return null

  const [host, portRaw, username, password] = parts
  const port = Number(portRaw)
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) return null

  return {
    protocol: fallbackProtocol,
    host,
    port,
    username: username || undefined,
    password: password || undefined,
  }
}

export async function bulkImportProxies(userId: string, dto: BulkImportProxyDto) {
  const group = await prisma.proxyGroup.findFirst({ where: { id: dto.proxyGroupId, userId } })
  if (!group) throw notFound("Proxy group")

  const lines = dto.lines.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const toCreate: Array<{
    proxyGroupId: string; protocol: any; category: any
    host: string; port: number; username: string | undefined; password: string | undefined; raw: string
  }> = []
  const errors: Array<{ line: string; reason: string }> = []

  for (const line of lines) {
    const parsed = parseProxyLine(line)
    if (!parsed) {
      errors.push({ line, reason: "Could not parse proxy format" })
      continue
    }
    toCreate.push({
      proxyGroupId: dto.proxyGroupId,
      protocol: dto.protocol ?? parsed.protocol,
      category: dto.category,
      host: parsed.host,
      port: parsed.port,
      username: parsed.username,
      password: parsed.password,
      raw: line,
    })
  }

  // Upsert — skip duplicates (same group + host + port)
  let imported = 0
  let skipped = 0
  for (const item of toCreate) {
    const exists = await prisma.proxy.findFirst({
      where: { proxyGroupId: item.proxyGroupId, host: item.host, port: item.port },
    })
    if (exists) { skipped++; continue }
    await prisma.proxy.create({ data: clean(item) })
    imported++
  }

  return { imported, skipped, failed: errors.length, errors }
}

export async function updateProxy(userId: string, id: string, dto: UpdateProxyDto) {
  const proxy = await prisma.proxy.findFirst({ where: { id, proxyGroup: { userId } } })
  if (!proxy) throw notFound("Proxy")
  return prisma.proxy.update({ where: { id }, data: clean(dto) })
}

export async function deleteProxy(userId: string, id: string) {
  const proxy = await prisma.proxy.findFirst({ where: { id, proxyGroup: { userId } } })
  if (!proxy) throw notFound("Proxy")
  await prisma.proxy.delete({ where: { id } })
}

// -----------------------------------------------------------------------
// Proxy checker
// -----------------------------------------------------------------------

async function applyCheckResult(id: string, result: ProxyCheckResult) {
  const status = resolveProxyStatus(result)
  await prisma.proxy.update({
    where: { id },
    data: {
      status,
      lastCheckedAt: new Date(),
      ...(result.ip !== null ? { ip: result.ip } : {}),
      ...(result.country !== null ? { country: result.country } : {}),
      ...(result.countryCode !== null ? { countryCode: result.countryCode } : {}),
      ...(result.latency !== null ? { latency: result.latency } : {}),
      ...(result.alive ? { successCount: { increment: 1 } } : { failCount: { increment: 1 } }),
    },
  })
  return { id, status, ...result }
}

export async function checkProxyById(
  userId: string,
  id: string,
  opts?: { timeout?: number },
) {
  const proxy = await prisma.proxy.findFirst({ where: { id, proxyGroup: { userId } } })
  if (!proxy) throw notFound("Proxy")

  const result = await checkProxy(
    { id: proxy.id, protocol: proxy.protocol, host: proxy.host, port: proxy.port, username: proxy.username, password: proxy.password },
    opts,
  )
  return applyCheckResult(id, result)
}

export async function checkGroupProxies(
  userId: string,
  groupId: string,
  opts?: { timeout?: number; concurrency?: number },
  onResult?: (id: string, row: Awaited<ReturnType<typeof applyCheckResult>>) => void,
) {
  const group = await prisma.proxyGroup.findFirst({ where: { id: groupId, userId } })
  if (!group) throw notFound("Proxy group")

  const proxies = await prisma.proxy.findMany({ where: { proxyGroupId: groupId } })
  const proxyRows = proxies.map((p) => ({
    id: p.id, protocol: p.protocol, host: p.host, port: p.port,
    username: p.username, password: p.password,
  }))

  const resultMap = await checkProxies(proxyRows, opts, async (id, result) => {
    const row = await applyCheckResult(id, result)
    onResult?.(id, row)
  })

  return { total: proxies.length, results: Object.fromEntries(resultMap) }
}
