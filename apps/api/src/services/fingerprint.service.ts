import { prisma } from "@tb/database"
import type { CreateFingerprintDto, UpdateFingerprintDto, QueryFingerprintDto } from "@tb/contracts"
import { notFound } from "../helpers/errors.js"
import { parsePagination } from "../helpers/pagination.js"
import { clean } from "../helpers/prisma.js"

export async function listFingerprints(userId: string, query: QueryFingerprintDto) {
  const { page, limit, skip } = parsePagination(query)
  const where = {
    userId,
    ...(query.deviceType ? { deviceType: query.deviceType } : {}),
    ...(query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : {}),
  }
  const [data, total] = await Promise.all([
    prisma.fingerprintProfile.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.fingerprintProfile.count({ where }),
  ])
  return { data, total, page, limit }
}

export async function getFingerprint(userId: string, id: string) {
  const fp = await prisma.fingerprintProfile.findFirst({ where: { id, userId } })
  if (!fp) throw notFound("Fingerprint profile")
  return fp
}

export async function createFingerprint(userId: string, dto: CreateFingerprintDto) {
  return prisma.fingerprintProfile.create({ data: clean({ ...dto, userId }) })
}

export async function updateFingerprint(userId: string, id: string, dto: UpdateFingerprintDto) {
  const fp = await prisma.fingerprintProfile.findFirst({ where: { id, userId } })
  if (!fp) throw notFound("Fingerprint profile")
  return prisma.fingerprintProfile.update({ where: { id }, data: clean(dto) })
}

export async function deleteFingerprint(userId: string, id: string) {
  const fp = await prisma.fingerprintProfile.findFirst({ where: { id, userId } })
  if (!fp) throw notFound("Fingerprint profile")
  await prisma.fingerprintProfile.delete({ where: { id } })
}
