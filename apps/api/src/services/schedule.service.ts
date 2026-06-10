import { prisma } from "@tb/database"
import type { CreateScheduleDto, UpdateScheduleDto } from "@tb/contracts"
import { notFound } from "../helpers/errors.js"
import { clean } from "../helpers/prisma.js"

async function assertCampaignOwnership(userId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } })
  if (!campaign) throw notFound("Campaign")
  return campaign
}

export async function listSchedules(userId: string, campaignId: string) {
  await assertCampaignOwnership(userId, campaignId)
  return prisma.campaignSchedule.findMany({
    where: { campaignId },
    orderBy: { createdAt: "asc" },
  })
}

export async function createSchedule(userId: string, campaignId: string, dto: CreateScheduleDto) {
  await assertCampaignOwnership(userId, campaignId)
  return prisma.campaignSchedule.create({ data: clean({ ...dto, campaignId }) })
}

export async function updateSchedule(userId: string, id: string, dto: UpdateScheduleDto) {
  const schedule = await prisma.campaignSchedule.findFirst({
    where: { id },
    include: { campaign: { select: { userId: true } } },
  })
  if (!schedule || schedule.campaign.userId !== userId) throw notFound("Schedule")
  return prisma.campaignSchedule.update({ where: { id }, data: clean(dto) })
}

export async function deleteSchedule(userId: string, id: string) {
  const schedule = await prisma.campaignSchedule.findFirst({
    where: { id },
    include: { campaign: { select: { userId: true } } },
  })
  if (!schedule || schedule.campaign.userId !== userId) throw notFound("Schedule")
  await prisma.campaignSchedule.delete({ where: { id } })
}
