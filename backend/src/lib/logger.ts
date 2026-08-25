export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  requestId?: string
  userId?: string
  trackId?: string
  route?: string
  method?: string
  statusCode?: number
  durationMs?: number
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined
  const sanitized: Record<string, unknown> = {}
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization', 'cookie', 'creditCard']

  for (const [key, value] of Object.entries(meta)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]'
    } else if (value instanceof Error) {
      sanitized[key] = {
        name: value.name,
        message: value.message,
        stack: value.stack
      }
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

function formatLog(level: LogLevel, message: string, context?: LogContext, meta?: Record<string, unknown>): string {
  const isProd = process.env.NODE_ENV === 'production'

  const payload = {
    timestamp: new Date().toISOString(),
    service: 'auraic-backend',
    environment: process.env.NODE_ENV || 'development',
    level: level.toUpperCase(),
    message,
    ...(context ? { context } : {}),
    ...(meta ? { meta: sanitizeMeta(meta) } : {})
  }

  if (isProd) {
    return JSON.stringify(payload)
  }

  // Human-friendly in development
  const reqStr = context?.requestId ? ` [req:${context.requestId.slice(0, 8)}]` : ''
  const durStr = context?.durationMs !== undefined ? ` (${context.durationMs.toFixed(1)}ms)` : ''
  const metaStr = meta ? ` ${JSON.stringify(sanitizeMeta(meta))}` : ''
  return `[${payload.timestamp}] ${payload.level}${reqStr}: ${message}${durStr}${metaStr}`
}

export const logger = {
  debug(message: string, context?: LogContext, meta?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      console.debug(formatLog('debug', message, context, meta))
    }
  },
  info(message: string, context?: LogContext, meta?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      console.log(formatLog('info', message, context, meta))
    }
  },
  warn(message: string, context?: LogContext, meta?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', message, context, meta))
    }
  },
  error(message: string, context?: LogContext, meta?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      console.error(formatLog('error', message, context, meta))
    }
  }
}
