import { prisma } from "@tb/database"
import type { UpsertSettingDto, BulkUpsertSettingDto } from "@tb/contracts"

export async function listSettings(userId: string) {
  const settings = await prisma.appSetting.findMany({
    where: { userId },
    orderBy: { key: "asc" },
  })
  // Mask secret values
  return settings.map((s) => ({
    ...s,
    value: s.isSecret ? "••••••••" : s.value,
  }))
}

export async function upsertSetting(userId: string, dto: UpsertSettingDto) {
  return prisma.appSetting.upsert({
    where: { userId_key: { userId, key: dto.key } },
    update: { value: dto.value, ...(dto.isSecret !== undefined ? { isSecret: dto.isSecret } : {}) },
    create: { userId, key: dto.key, value: dto.value, isSecret: dto.isSecret ?? false },
  })
}

export async function bulkUpsertSettings(userId: string, dto: BulkUpsertSettingDto) {
  const results = await Promise.all(dto.settings.map((s) => upsertSetting(userId, s)))
  return results
}

export async function deleteSetting(userId: string, key: string) {
  await prisma.appSetting.deleteMany({ where: { userId, key } })
}

export async function getSettingValue(userId: string, key: string): Promise<string | null> {
  const s = await prisma.appSetting.findUnique({ where: { userId_key: { userId, key } } })
  return s?.value ?? null
}
