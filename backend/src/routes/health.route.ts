import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { register } from '../lib/metrics'
import { getCacheStatus } from '../lib/redis'

const router = Router()

// Liveness probe
router.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

router.get('/livez', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' })
})

// Readiness probe (checks Database and critical subsystems)
router.get('/readyz', async (_req: Request, res: Response) => {
  const checkStart = Date.now()
  let dbStatus = 'healthy'
  let dbLatency = 0

  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    dbLatency = Date.now() - dbStart
  } catch (error) {
    dbStatus = `unhealthy: ${error instanceof Error ? error.message : 'DB unreachable'}`
  }

  const memory = process.memoryUsage()
  const cache = getCacheStatus()
  const isHealthy = dbStatus === 'healthy'

  const responsePayload = {
    status: isHealthy ? 'ready' : 'degraded',
    checks: {
      database: {
        status: dbStatus,
        latencyMs: dbLatency
      },
      cache: {
        mode: cache.mode,
        inMemoryKeyCount: cache.inMemoryKeyCount
      },
      process: {
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: {
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
          rss: Math.round(memory.rss / 1024 / 1024)
        },
        nodeVersion: process.version
      }
    },
    totalDurationMs: Date.now() - checkStart
  }

  res.status(isHealthy ? 200 : 503).json(responsePayload)
})

// Prometheus Metrics Scrape Endpoint
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    res.setHeader('Content-Type', register.contentType)
    const metrics = await register.metrics()
    res.send(metrics)
  } catch (error) {
    res.status(500).send(`Error collecting metrics: ${error}`)
  }
})

export default router
