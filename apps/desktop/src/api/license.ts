import { apiClient } from "./client.js"
import type { ApiResponse, LicenseSession } from "./types.js"

export interface LicensePayload {
  email: string
  licenseKey: string
  deviceId: string
  deviceName?: string
}

export const licenseApi = {
  activate(payload: LicensePayload) {
    return apiClient.post<ApiResponse<LicenseSession>>("/api/license/activate", payload)
      .then((res) => res.data)
  },

  validate(payload: LicensePayload) {
    return apiClient.post<ApiResponse<LicenseSession>>("/api/license/validate", payload)
      .then((res) => res.data)
  },
}
