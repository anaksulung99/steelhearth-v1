import { prisma, type Prisma } from "@tb/database"
import bcrypt from "bcryptjs"
import type { CreateUserWithLicenseDto, UpdateUserDto, QueryUserDto } from "@tb/contracts"
import { notFound, conflict } from "../helpers/errors.js"
import { parsePagination } from "../helpers/pagination.js"
import { clean } from "../helpers/prisma.js"

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  license: true,
} satisfies Prisma.UserSelect

export const listUsers = async (query: QueryUserDto) => {
  const { page, limit, skip } = parsePagination(query)

  const where: Prisma.UserWhereInput = {
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" as const } },
            { email: { contains: query.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(query.role ? {
      role: query.role
    } : {})
  }

  const [data, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, select: USER_SELECT }),
    prisma.user.count({ where })
  ])

  return { data, total, page, limit }
}
export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT })
  if (!user) throw notFound("User")
  return user
}
export const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email }, select: USER_SELECT })
  if (!user) throw notFound("User")
  return user
}
export const getUserByLicense = async (licenseKey: string) => {
  const license = await prisma.license.findUnique({ where: { licenseKey } })
  if (!license) throw notFound("License")

  return await getUserById(license.userId)
}

export const createUser = async (dto: CreateUserWithLicenseDto) => {
  const existingUser = await prisma.user.findUnique({ where: { email: dto.email }, select: { id: true } })
  if (existingUser) throw conflict(`User with ${dto.email} already registered`)

  const existingLicense = await prisma.license.findUnique({
    where: { licenseKey: dto.licenseKey },
    select: { id: true },
  })
  if (existingLicense) throw conflict("License key already registered")

  const passHash = await bcrypt.hash(dto.password, 12)

  return prisma.user.create({
    data: {
      name: dto.name,
      email: dto.email,
      role: dto.role,
      password: passHash,
      license: {
        create: {
          licenseKey: dto.licenseKey,
          expiresAt: dto.expiresAt
        }
      }
    },
    select: USER_SELECT,
  })
}
export const updateUser = async (id: string, dto: UpdateUserDto) => {
  const user = await prisma.user.findFirst({ where: { id } })
  if (!user) throw notFound("User profile")

  if (dto.email && dto.email !== user.email) {
    const existingUser = await prisma.user.findUnique({ where: { email: dto.email }, select: { id: true } })
    if (existingUser) throw conflict(`User with ${dto.email} already registered`)
  }

  const { password, ...rest } = dto
  return prisma.user.update({
    where: { id },
    data: clean({
      ...rest,
      ...(password ? { password: await bcrypt.hash(password, 12) } : {}),
    }),
    select: USER_SELECT,
  })
}

export const deleteUser = async (id: string) => {
  await getUserById(id)
  await prisma.user.delete({ where: { id } })
}
