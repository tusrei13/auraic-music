import { describe, expect, it } from 'vitest'
import { summarizeAnalyticsEvents } from './admin.controller'

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
})