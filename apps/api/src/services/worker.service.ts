import { prisma } from "@tb/database"
import type { QueryWorkerDto } from "@tb/contracts"
import { parsePagination } from "../helpers/pagination.js"

export async function listWorkers(query: QueryWorkerDto) {
  const { page, limit, skip } = parsePagination(query)
  const where = {
    ...(query.status ? { status: query.status } : {}),
  }
  const [data, total] = await Promise.all([
    prisma.workerNode.findMany({ where, skip, take: limit, orderBy: { lastHeartbeatAt: "desc" } }),
    prisma.workerNode.count({ where }),
  ])
  return { data, total, page, limit }
}

export async function getWorkerHealth() {
  const workers = await prisma.workerNode.findMany({
    where: { status: { in: ["ONLINE", "BUSY", "IDLE"] } },
  })
  return {
    totalWorkers: workers.length,
    onlineWorkers: workers.filter((w) => w.status !== "OFFLINE").length,
    busyWorkers: workers.filter((w) => w.status === "BUSY").length,
    totalActiveJobs: workers.reduce((sum, w) => sum + w.activeJobs, 0),
    totalCapacity: workers.reduce((sum, w) => sum + w.maxConcurrency, 0),
  }
}
