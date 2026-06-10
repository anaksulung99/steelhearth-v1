import { ZodError } from "zod"
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify"

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function notFound(resource = "Resource") {
  return new AppError(404, "NOT_FOUND", `${resource} not found`)
}

export function badRequest(message: string, details?: Record<string, unknown>) {
  return new AppError(400, "VALIDATION_ERROR", message, details)
}

export function forbidden(message = "Forbidden") {
  return new AppError(403, "FORBIDDEN", message)
}

export function conflict(message: string) {
  return new AppError(409, "CONFLICT", message)
}

export function errorHandler(
  error: FastifyError | AppError | ZodError | Error,
  _request: FastifyRequest,
  reply: FastifyReply,
) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      success: false,
      error: { code: error.code, message: error.message, details: error.details },
    })
  }

  // Duck-type check handles cross-package Zod instances (monorepo/multiple zod copies)
  const rawIssues = (error as any).issues
  const isZodLike = error instanceof ZodError
    || (Array.isArray(rawIssues) && rawIssues.length > 0 && typeof rawIssues[0]?.code === "string")
  if (isZodLike) {
    const issues: Array<{ path: (string | number)[]; message: string }> = rawIssues ?? []
    const details: Record<string, string[]> = {}
    for (const issue of issues) {
      const path = (issue.path ?? []).join(".") || "root"
      if (!details[path]) details[path] = []
      details[path]!.push(issue.message)
    }
    return reply.status(400).send({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid request payload", details },
    })
  }

  // Zod v4 serialises its message as a JSON array — detect and unwrap it
  if (typeof error.message === "string" && error.message.trimStart().startsWith("[")) {
    try {
      const parsed: Array<{ path?: (string | number)[]; message?: string }> = JSON.parse(error.message)
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0] != null && "code" in parsed[0]) {
        const details: Record<string, string[]> = {}
        for (const issue of parsed) {
          const path = (issue.path ?? []).join(".") || "root"
          if (!details[path]) details[path] = []
          details[path]!.push(issue.message || "Invalid value")
        }
        return reply.status(400).send({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid request payload", details },
        })
      }
    } catch { /* not JSON, fall through */ }
  }

  const status = (error as FastifyError).statusCode ?? 500
  const code = status === 404 ? "NOT_FOUND" : "INTERNAL_ERROR"

  return reply.status(status).send({
    success: false,
    error: { code, message: error.message || "Internal server error" },
  })
}
