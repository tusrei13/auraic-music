import { prisma } from '../lib/prisma'
import { AnalyticsEventType } from '@prisma/client'
import { logger } from '../lib/logger'
import { recordTrackPlayInChart } from './chart.service'

export interface IngestionEventInput {
  eventType: 'TRACK_STARTED' | 'TRACK_COMPLETED' | 'TRACK_SKIPPED'
  trackId: string
  source?: string
  title: string
  position?: number | null
  duration?: number | null
  occurredAt?: string | Date
}

export interface IngestionResult {
  accepted: number
  rejected: number
  duplicate: number
  errors: string[]
}

const recentEventsCache = new Map<string, number>()
const CLEANUP_INTERVAL_MS = 60_000

// Periodically clean up event deduplication cache
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamp] of recentEventsCache.entries()) {
    if (now - timestamp > 60_000) {
      recentEventsCache.delete(key)
    }
  }
}, CLEANUP_INTERVAL_MS).unref()

export async function processListeningEventsBatch(
  userId: string,
  events: IngestionEventInput[]
): Promise<IngestionResult> {
  const result: IngestionResult = {
    accepted: 0,
    rejected: 0,
    duplicate: 0,
    errors: []
  }

  const validEventsToInsert: Array<{
    userId: string
    eventType: AnalyticsEventType
    trackId: string
    source: string
    title: string
    position: number | null
    duration: number | null
    occurredAt: Date
  }> = []

  const now = Date.now()
  const MAX_DRIFT_MS = 5 * 60 * 1000 // 5 minutes

  for (const ev of events) {
    // 1. Basic validation
    if (!ev.trackId || !ev.title || !ev.eventType) {
      result.rejected += 1
      result.errors.push('Missing required event fields (trackId, title, eventType)')
      continue
    }

    const eventDate = ev.occurredAt ? new Date(ev.occurredAt) : new Date()
    const eventTime = eventDate.getTime()

    // 2. Timestamp drift check
    if (Math.abs(now - eventTime) > MAX_DRIFT_MS) {
      result.rejected += 1
      result.errors.push(`Timestamp drift exceeded limit for track ${ev.trackId}`)
      continue
    }

    // 3. Deduplication check (same user + trackId + eventType within 15 seconds)
    const dedupKey = `${userId}:${ev.trackId}:${ev.eventType}`
    const lastSeen = recentEventsCache.get(dedupKey)
    if (lastSeen && eventTime - lastSeen < 15_000) {
      result.duplicate += 1
      continue
    }

    recentEventsCache.set(dedupKey, eventTime)

    // 4. Map Prisma Enum
    let prismaEventType: AnalyticsEventType
    switch (ev.eventType) {
      case 'TRACK_STARTED':
        prismaEventType = AnalyticsEventType.TRACK_STARTED
        break
      case 'TRACK_COMPLETED':
        prismaEventType = AnalyticsEventType.TRACK_COMPLETED
        break
      case 'TRACK_SKIPPED':
        prismaEventType = AnalyticsEventType.TRACK_SKIPPED
        break
      default:
        result.rejected += 1
        result.errors.push(`Invalid event type: ${ev.eventType}`)
        continue
    }

    validEventsToInsert.push({
      userId,
      eventType: prismaEventType,
      trackId: String(ev.trackId),
      source: ev.source || 'jamendo',
      title: ev.title.slice(0, 300),
      position: ev.position !== undefined && ev.position !== null ? Math.max(0, ev.position) : null,
      duration: ev.duration !== undefined && ev.duration !== null ? Math.max(0, ev.duration) : null,
      occurredAt: eventDate
    })
  }

  if (validEventsToInsert.length > 0) {
    try {
      await prisma.analyticsEvent.createMany({
        data: validEventsToInsert
      })
      result.accepted = validEventsToInsert.length
      logger.debug(`Ingested ${result.accepted} analytics events for user ${userId.slice(0, 8)}`)

      // Update real-time Redis chart asynchronously for started tracks
      for (const item of validEventsToInsert) {
        if (item.eventType === AnalyticsEventType.TRACK_STARTED) {
          recordTrackPlayInChart({
            id: item.trackId,
            title: item.title,
            artistName: 'Jamendo Artist',
            duration: item.duration
          }).catch(err => logger.warn('Failed to update chart in Redis', undefined, { error: err }))
        }
      }
    } catch (err) {
      logger.error('Failed to batch insert analytics events', undefined, { error: err })
      result.rejected += validEventsToInsert.length
      result.errors.push('Database insertion failed')
    }
  }

  return result
}

export async function getUserListeningInsights(userId: string, days = 14) {
  const sinceDate = new Date()
  sinceDate.setDate(sinceDate.getDate() - days)

  const events = await prisma.analyticsEvent.findMany({
    where: {
      userId,
      occurredAt: { gte: sinceDate }
    },
    orderBy: { occurredAt: 'desc' },
    take: 1000
  })

  let startedCount = 0
  let completedCount = 0
  let skippedCount = 0
  const trackPlayCounts = new Map<string, { title: string; count: number }>()

  for (const ev of events) {
    if (ev.eventType === AnalyticsEventType.TRACK_STARTED) {
      startedCount += 1
      const current = trackPlayCounts.get(ev.trackId) || { title: ev.title, count: 0 }
      current.count += 1
      trackPlayCounts.set(ev.trackId, current)
    } else if (ev.eventType === AnalyticsEventType.TRACK_COMPLETED) {
      completedCount += 1
    } else if (ev.eventType === AnalyticsEventType.TRACK_SKIPPED) {
      skippedCount += 1
    }
  }

  const completionRate = startedCount > 0 ? (completedCount / startedCount) * 100 : 0
  const topTracks = Array.from(trackPlayCounts.entries())
    .map(([trackId, data]) => ({ trackId, title: data.title, plays: data.count }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10)

  return {
    periodDays: days,
    metrics: {
      started: startedCount,
      completed: completedCount,
      skipped: skippedCount,
      completionRate: Math.round(completionRate * 10) / 10
    },
    topTracks
  }
}
