import { Server } from 'node:http'
import { prisma } from './prisma'
import { logger } from './logger'
import { shutdownTracing } from './tracing'

export function setupGracefulShutdown(server: Server): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown sequence...`)

    server.close(async (err) => {
      if (err) {
        logger.error('Error while closing HTTP server sockets', undefined, { error: err })
        process.exit(1)
      }

      logger.info('HTTP server closed. Disconnecting tracing and database client...')

      try {
        await shutdownTracing()
        await prisma.$disconnect()
        logger.info('Tracing and database connections closed cleanly. Auraic process exiting normally.')
        process.exit(0)
      } catch (err) {
        logger.error('Error during graceful shutdown', undefined, { error: err })
        process.exit(1)
      }
    })

    setTimeout(() => {
      logger.error('Graceful shutdown timed out after 10s. Forcing process exit.')
      process.exit(1)
    }, 10000).unref()
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}
