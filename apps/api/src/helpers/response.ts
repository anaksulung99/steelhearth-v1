import type { PaginationMeta } from "@tb/contracts"

export function ok<T>(data: T) {
  return { success: true as const, data }
}

export function paginated<T>(data: T[], meta: PaginationMeta) {
  return { success: true as const, data, meta }
}

export function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}
