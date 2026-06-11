import { defineStore } from "pinia"
import { licenseApi, ApiError } from "@/api"
import type { LicenseSession, LicensePayload, ResetLicense } from "@/api"
import { toast } from 'vue3-toastify';

export const useLicenseStore = defineStore("license", () => {
  const current = ref<LicenseSession | null>(null)
  const loading = ref(false)

  async function activated(dto: LicensePayload) {
    loading.value = true
    try {
      const res = await licenseApi.activate(dto)
      current.value = res
      toast.success("license activated")
      return res
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function validate(dto: LicensePayload) {
    loading.value = true
    try {
      const res = await licenseApi.validate(dto)
      current.value = res
      toast.success("license validated")
      return res
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function reset(dto: ResetLicense) {
    loading.value = true
    try {
      const res = await licenseApi.reset(dto)
      current.value = res
      toast.success("license reseted")
      return res
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    current,
    loading,
    activated,
    validate,
    reset,
  }
})