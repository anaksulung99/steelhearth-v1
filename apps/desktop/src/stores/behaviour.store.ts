import { defineStore } from "pinia"
import { behavioursApi, ApiError } from "@/api"
import type { BehaviourProfile, CreateBehaviourDto, UpdateBehaviourDto } from "@/api"
import { toast } from 'vue3-toastify';

export const useBehaviourStore = defineStore("behaviour", () => {
  const items = ref<BehaviourProfile[]>([])
  const current = ref<BehaviourProfile | null>(null)
  const loading = ref(false)
  const total = ref(0)

  async function fetchAll(params?: { search?: string; type?: string }) {
    loading.value = true
    try {
      const res = await behavioursApi.list({ limit: 100, ...params })
      items.value = res.data
      total.value = res.meta.total
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    loading.value = true
    try {
      const res = await behavioursApi.get(id)
      current.value = res.data
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function create(dto: CreateBehaviourDto) {
    try {
      const res = await behavioursApi.create(dto)
      items.value.unshift(res.data)
      toast.success("Behaviour profile created")
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    }
  }

  async function update(id: string, dto: UpdateBehaviourDto) {
    try {
      const res = await behavioursApi.update(id, dto)
      const idx = items.value.findIndex((b) => b.id === id)
      if (idx !== -1) items.value[idx] = res.data
      if (current.value?.id === id) current.value = res.data
      toast.success("Behaviour profile updated")
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    }
  }

  async function remove(id: string) {
    try {
      await behavioursApi.delete(id)
      items.value = items.value.filter((b) => b.id !== id)
      toast.success("Behaviour profile deleted")
      return true
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return false
    }
  }

  return { items, current, loading, total, fetchAll, fetchOne, create, update, remove }
})
