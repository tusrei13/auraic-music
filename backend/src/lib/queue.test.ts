import { describe, it, expect, beforeEach } from 'vitest'
import { globalJobQueue } from './queue'

describe('Async Job Queue & Worker Engine', () => {
  beforeEach(() => {
    globalJobQueue.clearQueue()
  })

  it('enqueues and executes background jobs successfully', async () => {
    let executed = false
    globalJobQueue.registerHandler('TEST_JOB', async (data: { message: string }) => {
      expect(data.message).toBe('hello worker')
      executed = true
      return { ok: true }
    })

    const jobId = await globalJobQueue.add('TEST_JOB', { message: 'hello worker' })
    expect(jobId).toBeDefined()

    // Wait short time for async worker execution
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(executed).toBe(true)

    const stats = globalJobQueue.getQueueStats()
    expect(stats.completed).toBe(1)
    expect(stats.failed).toBe(0)
  })

  it('retries failed jobs up to maxAttempts', async () => {
    let attemptCount = 0
    globalJobQueue.registerHandler('FAILING_JOB', async () => {
      attemptCount++
      if (attemptCount < 2) {
        throw new Error('Temporary worker failure')
      }
      return { recovered: true }
    })

    await globalJobQueue.add('FAILING_JOB', {}, { maxAttempts: 3 })
    await new Promise((resolve) => setTimeout(resolve, 80))

    expect(attemptCount).toBe(2)
    const stats = globalJobQueue.getQueueStats()
    expect(stats.completed).toBe(1)
  })

  it('handles permanently failed jobs without crashing', async () => {
    globalJobQueue.registerHandler('FATAL_JOB', async () => {
      throw new Error('Fatal error')
    })

    await globalJobQueue.add('FATAL_JOB', {}, { maxAttempts: 1 })
    await new Promise((resolve) => setTimeout(resolve, 50))

    const stats = globalJobQueue.getQueueStats()
    expect(stats.failed).toBe(1)
  })
})
