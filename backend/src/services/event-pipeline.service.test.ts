import { describe, it, expect, vi } from 'vitest'
import { processListeningEventsBatch } from './event-pipeline.service'

vi.mock('../lib/prisma', () => ({
  prisma: {
    analyticsEvent: {
      createMany: vi.fn().mockResolvedValue({ count: 2 }),
      findMany: vi.fn().mockResolvedValue([])
    }
  }
}))

describe('Event Pipeline Service', () => {
  it('processes valid listening events batch', async () => {
    const result = await processListeningEventsBatch('user-123', [
      {
        eventType: 'TRACK_STARTED',
        trackId: 'track-1',
        title: 'Song One',
        occurredAt: new Date()
      },
      {
        eventType: 'TRACK_COMPLETED',
        trackId: 'track-1',
        title: 'Song One',
        occurredAt: new Date()
      }
    ])

    expect(result.accepted).toBe(2)
    expect(result.rejected).toBe(0)
    expect(result.duplicate).toBe(0)
  })

  it('rejects events with excessive timestamp drift', async () => {
    const pastDate = new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
    const result = await processListeningEventsBatch('user-123', [
      {
        eventType: 'TRACK_STARTED',
        trackId: 'track-2',
        title: 'Song Two',
        occurredAt: pastDate
      }
    ])

    expect(result.accepted).toBe(0)
    expect(result.rejected).toBe(1)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('deduplicates identical events fired within short window', async () => {
    const now = new Date()
    const result = await processListeningEventsBatch('user-456', [
      {
        eventType: 'TRACK_STARTED',
        trackId: 'track-3',
        title: 'Song Three',
        occurredAt: now
      },
      {
        eventType: 'TRACK_STARTED',
        trackId: 'track-3',
        title: 'Song Three',
        occurredAt: now
      }
    ])

    expect(result.accepted).toBe(1)
    expect(result.duplicate).toBe(1)
  })
})
