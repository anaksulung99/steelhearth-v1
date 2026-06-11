import { defineStore } from "pinia"
import { campaignsApi, ApiError } from "@/api"
import type { Campaign, CreateCampaignDto, UpdateCampaignDto } from "@/api"
import { toast } from 'vue3-toastify';

export const useCampaignStore = defineStore("campaign", () => {
  const items = ref<Campaign[]>([])
  const current = ref<Campaign | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)

  async function fetchAll(params?: { status?: string; search?: string; page?: number }) {
    loading.value = true
    try {
      const res = await campaignsApi.list({ page: params?.page ?? page.value, limit: limit.value, ...params })
      items.value = res.data
      total.value = res.meta.total
      if (params?.page) page.value = params.page
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    loading.value = true
    try {
      const res = await campaignsApi.get(id)
      current.value = res.data
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function create(dto: CreateCampaignDto): Promise<Campaign | null> {
    try {
      const res = await campaignsApi.create(dto)
      items.value.unshift(res.data)
      total.value++
      toast.success("Campaign created")
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    }
  }

  async function update(id: string, dto: UpdateCampaignDto): Promise<Campaign | null> {
    try {
      const res = await campaignsApi.update(id, dto)
      const idx = items.value.findIndex((c) => c.id === id)
      if (idx !== -1) items.value[idx] = res.data
      if (current.value?.id === id) current.value = res.data
      toast.success("Campaign updated")
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      await campaignsApi.delete(id)
      items.value = items.value.filter((c) => c.id !== id)
      total.value--
      toast.success("Campaign deleted")
      return true
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return false
    }
  }

  async function start(id: string) {
    try {
      const res = await campaignsApi.start(id)
      patchItem(res.data)
      toast.success("Campaign started")
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    }
  }

  async function pause(id: string) {
    try {
      const res = await campaignsApi.pause(id)
      patchItem(res.data)
      toast.success("Campaign paused")
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    }
  }

  async function stop(id: string) {
    try {
      const res = await campaignsApi.stop(id)
      patchItem(res.data)
      toast.success("Campaign stopped")
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    }
  }

  function patchItem(updated: Campaign) {
    const idx = items.value.findIndex((c) => c.id === updated.id)
    if (idx !== -1) items.value[idx] = updated
    if (current.value?.id === updated.id) current.value = updated
  }

  // ── WS-driven patches (called by AppLayout WS handlers) ──

  // sessionId → { progress, campaignId }
  const sessionProgress = ref<Map<string, { progress: number; campaignId: string }>>(new Map())

  function patchStatus(id: string, status: string) {
    const idx = items.value.findIndex((c) => c.id === id)
    if (idx !== -1) (items.value[idx] as any).status = status
    if (current.value?.id === id) (current.value as any).status = status
  }

  function patchSessionProgress(sessionId: string, campaignId: string, progress: number) {
    const next = new Map(sessionProgress.value)
    next.set(sessionId, { progress, campaignId })
    sessionProgress.value = next
    // Remove entry after a short delay once session completes
    if (progress >= 100) {
      setTimeout(() => {
        const m = new Map(sessionProgress.value)
        m.delete(sessionId)
        sessionProgress.value = m
      }, 3000)
    }
  }

  return {
    items,
    current,
    loading,
    total,
    page,
    limit,
    sessionProgress,
    fetchAll,
    fetchOne,
    create,
    update,
    remove,
    start,
    pause,
    stop,
    patchItem,
    patchStatus,
    patchSessionProgress,
  }
})
