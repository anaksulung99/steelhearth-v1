import { defineStore } from "pinia"
import { proxiesApi, ApiError } from "@/api"
import type { ProxyGroup, Proxy } from "@/api"
import { toast } from "vue-sonner"

export const useProxyStore = defineStore("proxy", () => {
  const groups = ref<ProxyGroup[]>([])
  const proxies = ref<Proxy[]>([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(50)
  const loading = ref(false)

  async function fetchGroups() {
    try {
      const res = await proxiesApi.listGroups()
      groups.value = res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    }
  }

  async function fetchProxies(params?: { proxyGroupId?: string; status?: string; page?: number }) {
    loading.value = true
    try {
      const res = await proxiesApi.list({ ...params, page: params?.page ?? page.value, limit: limit.value })
      proxies.value = res.data
      total.value = res.meta.total
      if (params?.page) page.value = params.page
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    } finally {
      loading.value = false
    }
  }

  async function createGroup(dto: { name: string; description?: string }) {
    try {
      const res = await proxiesApi.createGroup(dto)
      groups.value.push(res.data)
      toast.success("Proxy group created")
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    }
  }

  async function deleteGroup(id: string) {
    try {
      await proxiesApi.deleteGroup(id)
      groups.value = groups.value.filter((g) => g.id !== id)
      toast.success("Proxy group deleted")
      return true
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return false
    }
  }

  async function bulkImport(dto: { proxyGroupId: string; lines: string; protocol?: string; category?: string }) {
    try {
      const res = await proxiesApi.bulkImport(dto)
      if (res.data.imported > 0) {
        toast.success(`Imported ${res.data.imported}, skipped ${res.data.skipped}`)
      } else if (res.data.failed > 0) {
        toast.error(`No proxies imported. ${res.data.failed} line(s) failed to parse.`)
      } else {
        toast.info(`No new proxies imported. ${res.data.skipped} duplicate(s) skipped.`)
      }
      await fetchProxies({ proxyGroupId: dto.proxyGroupId })
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    }
  }

  async function deleteProxy(id: string) {
    try {
      await proxiesApi.delete(id)
      proxies.value = proxies.value.filter((p) => p.id !== id)
      total.value--
      return true
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return false
    }
  }

  // WS-driven: patch a single proxy in the current list without a full refetch
  function patchProxy(id: string, updates: Partial<Proxy>) {
    const idx = proxies.value.findIndex((p) => p.id === id)
    if (idx !== -1) proxies.value[idx] = { ...proxies.value[idx], ...updates }
  }

  return { groups, proxies, total, page, limit, loading, fetchGroups, fetchProxies, createGroup, deleteGroup, bulkImport, deleteProxy, patchProxy }
})
