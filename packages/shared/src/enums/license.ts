export const LicenseStatus = {
  NOT_ACTIVATED: "NOT_ACTIVATED",
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  SUSPENDED: "SUSPENDED",
  DEVICE_MISMATCH: "DEVICE_MISMATCH",
  REVOKED: "REVOKED",
} as const

export type LicenseStatus = (typeof LicenseStatus)[keyof typeof LicenseStatus]
