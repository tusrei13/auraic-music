import { logger } from './logger'
import client from 'prom-client'
import { register } from './metrics'

// Prometheus Metrics for Background Job Queue
export const queueJobsTotal = new client.Counter({
  name: 'queue_jobs_total',
  help: 'Total number of background queue jobs processed',
  labelNames: ['queue', 'job_name', 'status'],
  registers: [register]
})

export const queueJobDurationSeconds = new client.Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Duration of background queue jobs in seconds',
  labelNames: ['queue', 'job_name'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
})

export const queueActiveJobsGauge = new client.Gauge({
  name: 'queue_active_jobs',
  help: 'Number of currently active/in-flight background jobs',
  labelNames: ['queue'],
  registers: [register]
})

export type JobHandler<T = unknown, R = unknown> = (data: T) => Promise<R>

export interface Job<T = unknown> {
  id: string
  name: string
  data: T
  attempts: number
  maxAttempts: number
  createdAt: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  error?: string
}

class AsyncJobQueue {
  private queueName: string
  private handlers = new Map<string, JobHandler>()
  private jobQueue: Job[] = []
  private isProcessing = false
  private concurrency: number
  private activeWorkers = 0

  constructor(queueName = 'auraic-default-queue', concurrency = 3) {
    this.queueName = queueName
    this.concurrency = concurrency
  }

  public registerHandler<T, R>(jobName: string, handler: JobHandler<T, R>): void {
    this.handlers.set(jobName, handler as JobHandler)
    logger.debug(`Registered job handler for '${jobName}' on queue '${this.queueName}'`)
  }

  public async add<T>(jobName: string, data: T, options: { maxAttempts?: number } = {}): Promise<string> {
    const jobId = `${this.queueName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const job: Job<T> = {
      id: jobId,
      name: jobName,
      data,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: Date.now(),
      status: 'pending'
    }

    this.jobQueue.push(job as Job)
    logger.debug(`Enqueued job '${jobName}' [${jobId}]`)
    
    // Trigger queue processing asynchronously
    this.processNext()
    return jobId
  }

  private async processNext(): Promise<void> {
    if (this.activeWorkers >= this.concurrency) return

    const nextJob = this.jobQueue.find((j) => j.status === 'pending')
    if (!nextJob) return

    nextJob.status = 'running'
    this.activeWorkers++
    queueActiveJobsGauge.inc({ queue: this.queueName })

    const handler = this.handlers.get(nextJob.name)
    const startTime = process.hrtime.bigint()

    if (!handler) {
      nextJob.status = 'failed'
      nextJob.error = `No handler registered for job '${nextJob.name}'`
      this.activeWorkers--
      queueActiveJobsGauge.dec({ queue: this.queueName })
      queueJobsTotal.inc({ queue: this.queueName, job_name: nextJob.name, status: 'unhandled_error' })
      logger.error(nextJob.error)
      this.processNext()
      return
    }

    try {
      nextJob.attempts++
      await handler(nextJob.data)
      nextJob.status = 'completed'

      const durationSec = Number(process.hrtime.bigint() - startTime) / 1e9
      queueJobDurationSeconds.observe({ queue: this.queueName, job_name: nextJob.name }, durationSec)
      queueJobsTotal.inc({ queue: this.queueName, job_name: nextJob.name, status: 'success' })
      logger.debug(`Job '${nextJob.name}' [${nextJob.id}] completed in ${(durationSec * 1000).toFixed(2)}ms`)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      nextJob.error = errorMessage

      if (nextJob.attempts < nextJob.maxAttempts) {
        nextJob.status = 'pending' // Retry
        logger.warn(`Job '${nextJob.name}' [${nextJob.id}] failed (attempt ${nextJob.attempts}/${nextJob.maxAttempts}). Retrying...`, undefined, { error: errorMessage })
      } else {
        nextJob.status = 'failed'
        queueJobsTotal.inc({ queue: this.queueName, job_name: nextJob.name, status: 'fatal_failure' })
        logger.error(`Job '${nextJob.name}' [${nextJob.id}] failed permanently after ${nextJob.attempts} attempts`, undefined, { error: errorMessage })
      }
    } finally {
      this.activeWorkers--
      queueActiveJobsGauge.dec({ queue: this.queueName })
      // Clean up completed/failed jobs older than 100 items
      if (this.jobQueue.length > 100) {
        this.jobQueue = this.jobQueue.filter((j) => j.status === 'pending' || j.status === 'running')
      }
      // Process remaining jobs in queue
      this.processNext()
    }
  }

  public getQueueStats(): { pending: number; running: number; completed: number; failed: number } {
    return {
      pending: this.jobQueue.filter((j) => j.status === 'pending').length,
      running: this.jobQueue.filter((j) => j.status === 'running').length,
      completed: this.jobQueue.filter((j) => j.status === 'completed').length,
      failed: this.jobQueue.filter((j) => j.status === 'failed').length
    }
  }

  public clearQueue(): void {
    this.jobQueue = []
    this.activeWorkers = 0
  }
}

// Global default queue instance for Auraic Platform
export const globalJobQueue = new AsyncJobQueue('auraic-jobs', 4)

// Register standard background job handlers
globalJobQueue.registerHandler('ANALYTICS_AGGREGATION', async (data: { date?: string }) => {
  logger.info(`[WORKER] Aggregating analytics metrics for date: ${data.date || 'today'}`)
  // Simulates offline aggregation calculation
  return { success: true }
})

globalJobQueue.registerHandler('PRECOMPUTE_RECOMMENDATIONS', async (data: { userId: string }) => {
  logger.info(`[WORKER] Precomputing personalized playlist for user ${data.userId.slice(0, 8)}`)
  return { precomputed: true }
})
