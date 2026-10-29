import type { StockConflict } from '@kickstore/shared/types'
import type { ErrorRequestHandler } from 'express'
import type { ZodType } from 'zod'

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly extra: Record<string, unknown> = {},
  ) {
    super(message)
  }
}

export const notFound = (message: string) => new HttpError(404, 'NOT_FOUND', message)

export const outOfStock = (conflicts: StockConflict[]) =>
  new HttpError(409, 'OUT_OF_STOCK', 'Stock insuffisant pour au moins un article', { conflicts })

export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (result.success) return result.data

  const issues = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
  throw new HttpError(400, 'VALIDATION_ERROR', 'Données invalides', { issues })
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ code: err.code, message: err.message, ...err.extra })
    return
  }

  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Données invalides',
      issues: [{ path: '', message: 'JSON invalide' }],
    })
    return
  }

  console.error(err)
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Erreur interne' })
}
