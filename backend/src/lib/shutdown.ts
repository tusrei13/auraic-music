import { Server } from 'node:http'
import { prisma } from './prisma'
import { logger } from './logger'

export function setupGracefulShutdown(server: Server): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown sequence...`)

    // Stop accepting new connections
    server.close(async (err) => {
      if (err) {
        logger.error('Error while closing HTTP server sockets', undefined, { error: err })
        process.exit(1)
      }

      logger.info('HTTP server closed. Disconnecting database client...')

      try {
        await prisma.$disconnect()
        logger.info('Database connections closed cleanly. Auraic process exiting normally.')
        process.exit(0)
      } catch (dbErr) {
        logger.error('Error disconnecting database client during shutdown', undefined, { error: dbErr })
        process.exit(1)
      }
    })

    // Force shutdown after timeout (10 seconds) if requests are hung
    setTimeout(() => {
      logger.error('Graceful shutdown timed out after 10s. Forcing process exit.')
      process.exit(1)
    }, 10000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}
