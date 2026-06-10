import { prisma } from "@tb/database"
import { config } from "../config.js"

export async function registerWorkerNode() {
  await prisma.workerNode.upsert({
    where: { workerId: config.worker.id },
    create: {
      workerId: config.worker.id,
      status: "IDLE",
      maxConcurrency: config.worker.maxConcurrent,
      activeJobs: 0,
      lastHeartbeatAt: new Date(),
    },
    update: {
      status: "IDLE",
      maxConcurrency: config.worker.maxConcurrent,
      activeJobs: 0,
      lastHeartbeatAt: new Date(),
    },
  })
}

export async function heartbeat(activeJobs: number) {
  await prisma.workerNode.update({
    where: { workerId: config.worker.id },
    data: { lastHeartbeatAt: new Date(), activeJobs },
  })
}

export async function setWorkerStatus(status: "ONLINE" | "BUSY" | "IDLE" | "OFFLINE" | "ERROR", activeJobs = 0) {
  await prisma.workerNode.update({
    where: { workerId: config.worker.id },
    data: { status, activeJobs, lastHeartbeatAt: new Date() },
  }).catch(() => {})
}

export async function deregisterWorkerNode() {
  await prisma.workerNode.update({
    where: { workerId: config.worker.id },
    data: { status: "OFFLINE", activeJobs: 0 },
  }).catch(() => {})
}
