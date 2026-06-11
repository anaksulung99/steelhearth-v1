import { prisma } from "@tb/database"
import type { QueryLogDto } from "@tb/contracts"
import { parsePagination } from "../helpers/pagination.js"
import { notFound, forbidden } from "../helpers/errors.js"

export async function listLogs(query: QueryLogDto) {
  const { page, limit, skip } = parsePagination(query)
  const where = {
    ...(query.level ? { level: query.level } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.campaignId ? { campaignId: query.campaignId } : {}),
    ...(query.sessionId ? { sessionId: query.sessionId } : {}),
    ...(query.workerId ? { workerId: query.workerId } : {}),
    ...(query.dateFrom ? { createdAt: { gte: new Date(query.dateFrom) } } : {}),
    ...(query.dateTo ? { createdAt: { lte: new Date(query.dateTo) } } : {}),
    ...(query.search ? { message: { contains: query.search, mode: "insensitive" as const } } : {}),
  }
  const [data, total] = await Promise.all([
    prisma.systemLog.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.systemLog.count({ where }),
  ])
  return { data, total, page, limit }
}
export async function resetAllLogs(adminId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: adminId
    }
  })
  if (!user) return notFound("Session")

  if (user.role !== "OWNER") return forbidden("Permission denied")

  await Promise.all([
    prisma.browserSession.deleteMany(),
    prisma.sessionEvent.deleteMany(),
    prisma.systemLog.deleteMany()
  ])
}