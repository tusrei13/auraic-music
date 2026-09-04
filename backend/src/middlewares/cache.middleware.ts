import { Request, Response, NextFunction } from 'express'
import { cacheGet, cacheSet, cacheDel } from '../lib/redis'

export function cacheMiddleware(options: { ttlSeconds?: number; keyPrefix?: string; skipIf?: (req: Request) => boolean }) {
  const ttlSeconds = options.ttlSeconds || 300
  const keyPrefix = options.keyPrefix || 'route'

  return async (req: Request, res: Response, next: NextFunction) => {
    if (options.skipIf && options.skipIf(req)) return next()

    const key = `${keyPrefix}:${req.method}:${req.originalUrl}`
    const cached = await cacheGet<{ status: number; headers: Record<string, string>; body: unknown }>(key)
    if (cached) {
      for (const [header, value] of Object.entries(cached.headers)) {
        res.setHeader(header, value)
      }
      return res.status(cached.status).json(cached.body)
    }

    const originalJson = res.json.bind(res)
    const originalStatus = res.status.bind(res)
    const headers: Record<string, string> = {}

    res.setHeader = ((original: typeof res.setHeader) => {
      return (name: string, value: string) => {
        headers[name] = String(value)
        return original.call(res, name, value)
      }
    })(res.setHeader.bind(res))

    res.json = ((original: typeof res.json) => {
      return (body: unknown) => {
        const statusCode = res.statusCode
        cacheSet(key, { status: statusCode, headers, body }, ttlSeconds).catch(() => undefined)
        return original(body)
      }
    })(res.json.bind(res))

    next()
  }
}
