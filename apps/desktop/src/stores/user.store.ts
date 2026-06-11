import { defineStore } from "pinia"
import { userApi, ApiError } from "@/api"
import type { User, CreateUserWithLicenseDto, UpdateUserDto } from "@/api"
import { toast } from 'vue3-toastify';

export const useUserStore = defineStore("user", () => {
  const items = ref<User[]>([])
  const current = ref<User | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(20)

  async function fetchAll(params?: { role?: string; search?: string; page?: number }) {
    loading.value = true
    try {
      const res = await userApi.list({ page: params?.page ?? page.value, limit: limit.value, ...params })
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
      const res = await userApi.get(id)
      current.value = res.data
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchByEmail(email: string) {
    loading.value = true
    try {
      const res = await userApi.getByEmail(email)
      current.value = res.data
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchByLicense(license: string) {
    loading.value = true
    try {
      const res = await userApi.getByLicense(license)
      current.value = res.data
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    } finally {
      loading.value = false
    }
  }

  async function create(dto: CreateUserWithLicenseDto): Promise<User | null> {
    try {
      const res = await userApi.create(dto)
      items.value.unshift(res.data)
      total.value++
      toast.success("User created")
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    }
  }

  async function update(id: string, dto: UpdateUserDto): Promise<User | null> {
    try {
      const res = await userApi.update(id, dto)
      const idx = items.value.findIndex((c) => c.id === id)
      if (idx !== -1) items.value[idx] = res.data
      if (current.value?.id === id) current.value = res.data
      toast.success("User updated")
      return res.data
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return null
    }
  }

  async function remove(id: string): Promise<boolean> {
    try {
      await userApi.delete(id)
      items.value = items.value.filter((c) => c.id !== id)
      total.value--
      toast.success("User deleted")
      return true
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message)
      return false
    }
  }

  return {
    items,
    current,
    loading,
    total,
    page,
    limit,
    fetchAll,
    fetchOne,
    fetchByEmail,
    fetchByLicense,
    create,
    update,
    remove
  }
})