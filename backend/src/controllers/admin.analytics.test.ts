import { describe, expect, it } from 'vitest'
import { assessAnalyticsQuality, summarizeAnalyticsEvents } from '../services/analytics.service'

describe('summarizeAnalyticsEvents', () => {
  it('counts playback events and ranks tracks by starts', () => {
    const events = [
      { eventType: 'TRACK_STARTED' as const, trackId: 'jamendo:1', title: 'One', occurredAt: new Date() },
      { eventType: 'TRACK_STARTED' as const, trackId: 'jamendo:1', title: 'One', occurredAt: new Date() },
      { eventType: 'TRACK_COMPLETED' as const, trackId: 'jamendo:1', title: 'One', occurredAt: new Date() },
      { eventType: 'TRACK_SKIPPED' as const, trackId: 'jamendo:2', title: 'Two', occurredAt: new Date() },
    ]

    const summary = summarizeAnalyticsEvents(events)
    expect(summary.totals).toEqual({ started: 2, completed: 1, skipped: 1 })
    expect(summary.topTracks[0]).toEqual({ trackId: 'jamendo:1', title: 'One', plays: 2 })
    expect(summary.daily).toHaveLength(7)
  })

  it('reports invalid and duplicate event data without deleting source events', () => {
    const occurredAt = new Date()
    const events = [
      { userId: 'user-1', eventType: 'TRACK_STARTED' as const, trackId: 'jamendo:1', title: 'Track', source: 'jamendo', occurredAt },
      { userId: 'user-1', eventType: 'TRACK_STARTED' as const, trackId: 'jamendo:1', title: '', source: 'unknown', position: 20, duration: 10, occurredAt: new Date(occurredAt.getTime() + 1_000) },
    ]

    expect(assessAnalyticsQuality(events)).toEqual({ invalidTitle: 1, invalidTiming: 1, unknownSource: 1, duplicateStarted: 1, totalIssues: 4 })
  })
})