import { Request, Response, NextFunction } from 'express'
import { httpRequestDurationSeconds, httpRequestsTotal, activeRequestsGauge } from '../lib/metrics'
import { logger } from '../lib/logger'

function normalizeRoutePath(req: Request): string {
  // Normalize parameters to avoid high cardinality in Prometheus metrics
  if (req.baseUrl || req.route?.path) {
    const base = req.baseUrl || ''
    const sub = req.route?.path || ''
    return `${base}${sub}` || req.path
  }
  // Fallback pattern matching for common paths
  const p = req.path
  return p
    .replace(/\/playlists\/[0-9a-fA-F-]+/g, '/playlists/:id')
    .replace(/\/songs\/[0-9a-fA-F-]+/g, '/songs/:id')
    .replace(/\/artists\/[0-9a-fA-F-]+/g, '/artists/:id')
    .replace(/\/catalog\/tracks\/[0-9a-zA-Z_-]+/g, '/catalog/tracks/:id')
}

export function observabilityMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startHrTime = process.hrtime()
  activeRequestsGauge.inc()

  res.on('finish', () => {
    activeRequestsGauge.dec()
    const elapsedHrTime = process.hrtime(startHrTime)
    const durationSeconds = elapsedHrTime[0] + elapsedHrTime[1] / 1e9
    const durationMs = durationSeconds * 1000

    const route = normalizeRoutePath(req)
    const statusCode = res.statusCode.toString()
    const method = req.method

    // Record Prometheus Metrics
    httpRequestDurationSeconds.observe({ method, route, status_code: statusCode }, durationSeconds)
    httpRequestsTotal.inc({ method, route, status_code: statusCode })

    // Structured Request Log
    const requestId = (req as Request & { context?: { requestId?: string; userId?: string } }).context?.requestId
    const userId = (req as Request & { context?: { requestId?: string; userId?: string } }).context?.userId

    if (res.statusCode >= 500) {
      logger.error(`HTTP ${method} ${req.originalUrl} failed with status ${res.statusCode}`, {
        requestId,
        userId,
        route,
        method,
        statusCode: res.statusCode,
        durationMs
      })
    } else if (res.statusCode >= 400) {
      logger.warn(`HTTP ${method} ${req.originalUrl} responded with client error ${res.statusCode}`, {
        requestId,
        userId,
        route,
        method,
        statusCode: res.statusCode,
        durationMs
      })
    } else {
      logger.info(`HTTP ${method} ${req.originalUrl} ${res.statusCode}`, {
        requestId,
        userId,
        route,
        method,
        statusCode: res.statusCode,
        durationMs
      })
    }
  })

  next()
}
