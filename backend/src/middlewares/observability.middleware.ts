import { Request, Response, NextFunction } from 'express'
import { httpRequestDurationSeconds, httpRequestsTotal, activeRequestsGauge } from '../lib/metrics'
import { logger } from '../lib/logger'

let trace: { getCurrentSpan?: () => { setAttribute: (key: string, value: unknown) => void; setAttributes: (attrs: Record<string, unknown>) => void } } | null = null
try {
  // OpenTelemetry is optional; tracing degrades gracefully if not initialized
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  trace = require('@opentelemetry/api')
} catch {
  trace = null
}

function addSpanAttributes(req: Request) {
  if (!trace?.getCurrentSpan) return
  const span = trace.getCurrentSpan()
  if (!span?.setAttribute) return

  const ctx = (req as Request & { context?: { requestId?: string; userId?: string } }).context
  const attributes: Record<string, unknown> = {
    'http.request_id': ctx?.requestId || '',
    'http.user_id': ctx?.userId || '',
    'http.method': req.method,
    'http.url': req.originalUrl,
    'http.client_ip': req.ip || '',
    'http.user_agent': typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 200) : '',
  }

  span.setAttributes(attributes)
}

function normalizeRoutePath(req: Request): string {
  if (req.baseUrl || req.route?.path) {
    const base = req.baseUrl || ''
    const sub = req.route?.path || ''
    return `${base}${sub}` || req.path
  }
  const p = req.path
  return p
    .replace(/\/playlists\/[0-9a-fA-F-]+/g, '/playlists/:id')
    .replace(/\/songs\/[0-9a-fA-F-]+/g, '/songs/:id')
    .replace(/\/artists\/[0-9a-fA-F-]+/g, '/artists/:id')
    .replace(/\/catalog\/tracks\/[0-9a-zA-Z_-]+/g, '/catalog/tracks/:id')
}

export function observabilityMiddleware(req: Request, res: Response, next: NextFunction): void {
  addSpanAttributes(req)
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

    httpRequestDurationSeconds.observe({ method, route, status_code: statusCode }, durationSeconds)
    httpRequestsTotal.inc({ method, route, status_code: statusCode })

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
