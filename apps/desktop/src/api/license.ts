import { apiClient } from "./client.js"
import type { ApiResponse, LicenseInfo, LicenseSession, ResetLicense, LicensePayload } from "./types.js"


export const licenseApi = {
  activate(payload: LicensePayload) {
    return apiClient.post<ApiResponse<LicenseSession>>("/api/license/activate", payload)
      .then((res) => res.data)
  },

  validate(payload: LicensePayload) {
    return apiClient.post<ApiResponse<LicenseSession>>("/api/license/validate", payload)
      .then((res) => res.data)
  },
  reset(payload: ResetLicense) {
    return apiClient.post<ApiResponse<LicenseSession>>("/api/license/reset-activation", payload)
      .then((res) => res.data)
  },
}
