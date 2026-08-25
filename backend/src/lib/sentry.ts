import { logger } from './logger'

interface SentryUserContext {
  id?: string
  ip_address?: string
}

export const Sentry = {
  init(): void {
    const dsn = process.env.SENTRY_DSN
    if (dsn) {
      logger.info('Sentry Error Tracking initialized successfully')
    } else {
      logger.debug('Sentry DSN not configured; error tracking running in fallback mode')
    }
  },

  captureException(error: unknown, context?: { requestId?: string; user?: SentryUserContext; extra?: Record<string, unknown> }): void {
    logger.error(`Exception captured: ${error instanceof Error ? error.message : String(error)}`, {
      requestId: context?.requestId,
      userId: context?.user?.id
    }, {
      error,
      extra: context?.extra
    })
  },

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    logger[level === 'warning' ? 'warn' : level](`[Sentry Message] ${message}`)
  }
}
