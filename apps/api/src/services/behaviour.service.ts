import { prisma } from "@tb/database"
import type { CreateBehaviourDto, UpdateBehaviourDto, QueryBehaviourDto } from "@tb/contracts"
import { notFound } from "../helpers/errors.js"
import { parsePagination } from "../helpers/pagination.js"
import { clean } from "../helpers/prisma.js"

export async function listBehaviours(userId: string, query: QueryBehaviourDto) {
  const { page, limit, skip } = parsePagination(query)
  const where = {
    userId,
    ...(query.type ? { type: query.type } : {}),
    ...(query.search ? { name: { contains: query.search, mode: "insensitive" as const } } : {}),
  }
  const [data, total] = await Promise.all([
    prisma.behaviourProfile.findMany({
      where, skip, take: limit, orderBy: { createdAt: "desc" },
      include: { customClickSelectors: { orderBy: { order: "asc" } } },
    }),
    prisma.behaviourProfile.count({ where }),
  ])
  return { data, total, page, limit }
}

export async function getBehaviour(userId: string, id: string) {
  const b = await prisma.behaviourProfile.findFirst({
    where: { id, userId },
    include: { customClickSelectors: { orderBy: { order: "asc" } } },
  })
  if (!b) throw notFound("Behaviour profile")
  return b
}

export async function createBehaviour(userId: string, dto: CreateBehaviourDto) {
  const { customClickSelectors, ...rest } = dto
  return prisma.behaviourProfile.create({
    data: {
      ...clean(rest),
      userId,
      customClickSelectors: {
        create: (customClickSelectors ?? []).map((s) => clean({
          selector: s.selector,
          selectorType: s.selectorType ?? "css",
          description: s.description,
          order: s.order ?? 0,
        })),
      },
    },
    include: { customClickSelectors: { orderBy: { order: "asc" } } },
  })
}

export async function updateBehaviour(userId: string, id: string, dto: UpdateBehaviourDto) {
  const b = await prisma.behaviourProfile.findFirst({ where: { id, userId } })
  if (!b) throw notFound("Behaviour profile")

  const { customClickSelectors, ...rest } = dto
  return prisma.behaviourProfile.update({
    where: { id },
    data: {
      ...clean(rest),
      ...(customClickSelectors !== undefined
        ? {
            customClickSelectors: {
              deleteMany: {},
              create: customClickSelectors.map((s) => clean({
                selector: s.selector,
                selectorType: s.selectorType ?? "css",
                description: s.description,
                order: s.order ?? 0,
              })),
            },
          }
        : {}),
    },
    include: { customClickSelectors: { orderBy: { order: "asc" } } },
  })
}

export async function deleteBehaviour(userId: string, id: string) {
  const b = await prisma.behaviourProfile.findFirst({ where: { id, userId } })
  if (!b) throw notFound("Behaviour profile")
  await prisma.behaviourProfile.delete({ where: { id } })
}
