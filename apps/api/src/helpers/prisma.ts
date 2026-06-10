/**
 * Strips undefined-valued keys so Prisma doesn't get `{ key: undefined }`
 * which conflicts with exactOptionalPropertyTypes. Cast result to `any`
 * at call sites so TS doesn't re-check the stripped object against Prisma's
 * strict input types (Zod already validated the input).
 */
export function clean<T extends Record<string, unknown>>(obj: T): any {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  )
}
