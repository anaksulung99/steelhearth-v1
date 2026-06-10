import crypto from "crypto"

export const generateLicenseKey = (): string => {
  const timestamp = Date.now().toString() // 13 Karakter
  const randomHex = crypto.randomBytes(16).toString("hex") // 128 Karakter

  const rawKey = `ST-${timestamp}${randomHex}`.toUpperCase()
  // Pecah menjadi kelompok terdiri dari 4 karakter yang dipisah tanda hubung (-)
  const formattedKey = rawKey.match(/.{1,4}/g)?.join("-")

  return formattedKey || rawKey
}