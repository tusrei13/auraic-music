import { createHash, randomUUID } from 'node:crypto'
import { NextFunction, Request, Response } from 'express'
import { sendError } from '../lib/api-error'

declare global {
  namespace Express { interface Request { requestId?: string } }
}

export const requestContext = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header('x-request-id')?.slice(0, 100) || randomUUID()
  req.requestId = requestId
  res.setHeader('x-request-id', requestId)
  const startedAt = process.hrtime.bigint()
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    const userId = (req as Request & { user?: { id?: string } }).user?.id
    console.info(JSON.stringify({
      event: 'http_request',
      requestId,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ...(userId ? { userId: createHash('sha256').update(userId).digest('hex').slice(0, 16) } : {}),
    }))
  })
  next()
}

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

/** Small bounded in-memory limiter for the modular-monolith stage. Replace with Redis when multi-instance. */
export const rateLimit = (windowMs: number, max: number) => (req: Request, res: Response, next: NextFunction) => {
  const now = Date.now()
  const key = `${req.ip}:${req.path}`
  const current = buckets.get(key)
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current
  bucket.count += 1
  buckets.set(key, bucket)
  res.setHeader('x-ratelimit-limit', max)
  res.setHeader('x-ratelimit-remaining', Math.max(0, max - bucket.count))
  if (bucket.count > max) {
    res.setHeader('retry-after', Math.ceil((bucket.resetAt - now) / 1000))
    return sendError(res, 429, 'RATE_LIMITED', 'Quá nhiều yêu cầu, vui lòng thử lại sau')
  }
  next()
}
