import { prisma } from "@tb/database"
import type { ActivateLicenseDto, ResetLicenseActivationDto, ValidateLicenseDto } from "@tb/contracts"
import { conflict, forbidden, notFound } from "../helpers/errors.js"

function isExpired(expiresAt: Date | null) {
  return expiresAt != null && expiresAt.getTime() <= Date.now()
}

function getOfflineUntil() {
  const offlineUntil = new Date()
  offlineUntil.setDate(offlineUntil.getDate() + 3)
  return offlineUntil
}

async function loadLicense(email: string, licenseKey: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { license: true },
  })
  if (!user || !user.license || user.license.licenseKey !== licenseKey) {
    throw notFound("License")
  }
  if (!user.isActive) throw forbidden("User is inactive")
  return { user, license: user.license }
}

export async function activateLicense(dto: ActivateLicenseDto) {
  const { user, license } = await loadLicense(dto.email, dto.licenseKey)

  if (["SUSPENDED", "REVOKED"].includes(license.status)) {
    throw forbidden(`License is ${license.status.toLowerCase()}`)
  }

  if (isExpired(license.expiresAt)) {
    const updated = await prisma.license.update({
      where: { id: license.id },
      data: { status: "EXPIRED", lastValidatedAt: new Date() },
    })
    throw forbidden(`License is expired (${updated.id})`)
  }

  if (license.deviceId && license.deviceId !== dto.deviceId) {
    await prisma.license.update({
      where: { id: license.id },
      data: { status: "DEVICE_MISMATCH", lastValidatedAt: new Date() },
    })
    throw conflict("License already activated on another device")
  }

  const activated = await prisma.license.update({
    where: { id: license.id },
    data: {
      deviceId: dto.deviceId,
      ...(dto.deviceName ? { deviceName: dto.deviceName } : {}),
      activatedAt: license.activatedAt ?? new Date(),
      lastValidatedAt: new Date(),
      offlineUntil: getOfflineUntil(),
      status: "ACTIVE",
    },
  })

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
    license: activated,
  }
}

export async function validateLicense(dto: ValidateLicenseDto) {
  const { user, license } = await loadLicense(dto.email, dto.licenseKey)

  if (license.deviceId !== dto.deviceId) {
    throw conflict("License is not activated for this device")
  }

  if (["SUSPENDED", "REVOKED", "DEVICE_MISMATCH"].includes(license.status)) {
    throw forbidden(`License is ${license.status.toLowerCase()}`)
  }

  if (isExpired(license.expiresAt)) {
    await prisma.license.update({
      where: { id: license.id },
      data: { status: "EXPIRED", lastValidatedAt: new Date() },
    })
    throw forbidden("License is expired")
  }

  const validated = await prisma.license.update({
    where: { id: license.id },
    data: {
      lastValidatedAt: new Date(),
      offlineUntil: getOfflineUntil(),
      status: "ACTIVE",
    },
  })

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
    license: validated,
  }
}

export async function resetLicenseActivation(dto: Omit<ResetLicenseActivationDto, "resetToken">) {
  const where = dto.licenseKey
    ? { licenseKey: dto.licenseKey }
    : { user: { email: dto.email! } }

  const license = await prisma.license.findFirst({
    where,
    include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
  })

  if (!license) throw notFound("License")

  const reset = await prisma.license.update({
    where: { id: license.id },
    data: {
      deviceId: null,
      deviceName: null,
      activatedAt: null,
      lastValidatedAt: null,
      offlineUntil: null,
      status: "NOT_ACTIVATED",
    },
  })

  return {
    user: license.user,
    license: reset,
  }
}
