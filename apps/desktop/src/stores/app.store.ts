import { defineStore } from "pinia"
import { apiClient, settingsApi, licenseApi, ApiError } from "@/api"
import type { LicenseSession } from "@/api"
import { toast } from "vue-sonner"

const API_URL_KEY = "tb_api_url"
const API_TOKEN_KEY = "tb_api_token"
const LICENSE_SESSION_KEY = "tb_license_session"
const LICENSE_KEY_KEY = "tb_license_key"
const LICENSE_VALIDATED_AT_KEY = "tb_license_validated_at"
const LICENSE_VALIDATION_TTL_MS = 5 * 60 * 1000

function loadLicenseSession(): LicenseSession | null {
  try {
    const raw = localStorage.getItem(LICENSE_SESSION_KEY)
    return raw ? JSON.parse(raw) as LicenseSession : null
  } catch {
    return null
  }
}

async function getDeviceInfo() {
  if (window.electronAPI?.getDeviceInfo) return window.electronAPI.getDeviceInfo()

  const fallbackKey = "tb_browser_device_id"
  let deviceId = localStorage.getItem(fallbackKey)
  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem(fallbackKey, deviceId)
  }
  return { deviceId, deviceName: navigator.userAgent }
}

function buildLicenseAuth(session: LicenseSession | null, key: string) {
  return session && key && session.license.deviceId
    ? { email: session.user.email, licenseKey: key, deviceId: session.license.deviceId }
    : null
}

export const useAppStore = defineStore("app", () => {
  const apiUrl = ref(localStorage.getItem(API_URL_KEY) ?? "http://127.0.0.1:3741")
  const apiToken = ref(localStorage.getItem(API_TOKEN_KEY) ?? "")
  const licenseKey = ref(localStorage.getItem(LICENSE_KEY_KEY) ?? "")
  const licenseSession = ref<LicenseSession | null>(loadLicenseSession())
  const connected = ref(false)
  const connecting = ref(false)
  const validatingLicense = ref(false)
  const licenseValidatedAt = ref(Number(localStorage.getItem(LICENSE_VALIDATED_AT_KEY) ?? 0))

  // Sync apiClient whenever store changes
  watch(apiUrl, (v) => {
    apiClient.baseUrl = v
    localStorage.setItem(API_URL_KEY, v)
  }, { immediate: true })

  watch(apiToken, (v) => {
    apiClient.token = v || null
    localStorage.setItem(API_TOKEN_KEY, v)
  }, { immediate: true })

  watch(licenseSession, (v) => {
    if (v) localStorage.setItem(LICENSE_SESSION_KEY, JSON.stringify(v))
    else localStorage.removeItem(LICENSE_SESSION_KEY)
    apiClient.licenseAuth = buildLicenseAuth(v, licenseKey.value)
  }, { deep: true })

  watch(licenseKey, (v) => {
    localStorage.setItem(LICENSE_KEY_KEY, v)
    apiClient.licenseAuth = buildLicenseAuth(licenseSession.value, v)
  })

  apiClient.licenseAuth = buildLicenseAuth(licenseSession.value, licenseKey.value)

  const hasLicenseSession = computed(() => Boolean(licenseSession.value && licenseKey.value))
  const isLicenseLocallyUsable = computed(() => {
    const session = licenseSession.value
    if (!session || !licenseKey.value) return false
    if (session.license.status !== "ACTIVE") return false
    if (!session.license.deviceId) return false
    if (session.license.expiresAt && new Date(session.license.expiresAt).getTime() <= Date.now()) {
      return false
    }
    return true
  })
  const isOfflineLicenseUsable = computed(() => {
    const offlineUntil = licenseSession.value?.license.offlineUntil
    return isLicenseLocallyUsable.value
      && Boolean(offlineUntil)
      && new Date(offlineUntil as string).getTime() > Date.now()
  })

  async function checkConnection(): Promise<boolean> {
    connecting.value = true
    try {
      const res = await fetch(`${apiClient.baseUrl}/health`, { signal: AbortSignal.timeout(5000) })
      connected.value = res.ok
      return res.ok
    } catch {
      connected.value = false
      return false
    } finally {
      connecting.value = false
    }
  }

  async function saveSettings(url: string, token: string) {
    apiUrl.value = url
    apiToken.value = token

    try {
      if (token) {
        await settingsApi.set("api_token", token, true)
      }
      toast.success("Settings saved")
    } catch (err) {
      if (err instanceof ApiError && err.status !== 401) {
        toast.error("Failed to save settings to server")
      }
    }
  }

  async function activateLicense(email: string, key: string): Promise<boolean> {
    connecting.value = true
    try {
      const device = await getDeviceInfo()
      const session = await licenseApi.activate({
        email,
        licenseKey: key,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
      })
      licenseKey.value = key
      licenseSession.value = session
      licenseValidatedAt.value = Date.now()
      localStorage.setItem(LICENSE_VALIDATED_AT_KEY, String(licenseValidatedAt.value))
      connected.value = true
      return true
    } catch (err) {
      licenseSession.value = null
      if (err instanceof ApiError) toast.error(err.message)
      return false
    } finally {
      connecting.value = false
    }
  }

  async function validateLicense(): Promise<boolean> {
    if (!isLicenseLocallyUsable.value || !licenseSession.value || !licenseKey.value) {
      logout()
      return false
    }

    validatingLicense.value = true
    try {
      const device = await getDeviceInfo()
      const session = await licenseApi.validate({
        email: licenseSession.value.user.email,
        licenseKey: licenseKey.value,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
      })
      licenseSession.value = session
      licenseValidatedAt.value = Date.now()
      localStorage.setItem(LICENSE_VALIDATED_AT_KEY, String(licenseValidatedAt.value))
      return session.license.status === "ACTIVE"
    } catch (err) {
      if (!(err instanceof ApiError) && isOfflineLicenseUsable.value) return true
      licenseSession.value = null
      return false
    } finally {
      validatingLicense.value = false
    }
  }

  function logout() {
    licenseSession.value = null
    licenseKey.value = ""
    apiToken.value = ""
    licenseValidatedAt.value = 0
    localStorage.removeItem(LICENSE_VALIDATED_AT_KEY)
  }

  async function ensureAuthenticated(options: { force?: boolean } = {}): Promise<boolean> {
    if (!hasLicenseSession.value || !isLicenseLocallyUsable.value) {
      logout()
      return false
    }

    const recentlyValidated = Date.now() - licenseValidatedAt.value < LICENSE_VALIDATION_TTL_MS
    if (!options.force && recentlyValidated) return true

    return validateLicense()
  }

  return {
    apiUrl,
    apiToken,
    licenseKey,
    licenseSession,
    hasLicenseSession,
    isLicenseLocallyUsable,
    isOfflineLicenseUsable,
    connected,
    connecting,
    validatingLicense,
    checkConnection,
    saveSettings,
    activateLicense,
    validateLicense,
    ensureAuthenticated,
    logout,
  }
})
