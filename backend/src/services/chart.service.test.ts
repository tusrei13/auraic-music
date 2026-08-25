import { describe, it, expect, beforeEach } from 'vitest'
import { recordTrackPlayInChart, getPublicChart } from './chart.service'
import { cacheFlush } from '../lib/redis'

describe('Real-time Public Chart Service (Redis ZSET)', () => {
  beforeEach(async () => {
    await cacheFlush()
  })

  it('increments track play scores and generates sorted leaderboard', async () => {
    // Simulate plays for multiple tracks
    await recordTrackPlayInChart({ id: 'track-A', title: 'Song Alpha', artistName: 'Artist A' })
    await recordTrackPlayInChart({ id: 'track-A', title: 'Song Alpha', artistName: 'Artist A' })
    await recordTrackPlayInChart({ id: 'track-A', title: 'Song Alpha', artistName: 'Artist A' })

    await recordTrackPlayInChart({ id: 'track-B', title: 'Song Beta', artistName: 'Artist B' })
    await recordTrackPlayInChart({ id: 'track-B', title: 'Song Beta', artistName: 'Artist B' })

    await recordTrackPlayInChart({ id: 'track-C', title: 'Song Gamma', artistName: 'Artist C' })

    const dailyChart = await getPublicChart('daily', 5)

    expect(dailyChart.tracks.length).toBe(3)
    // Rank 1: Song Alpha with 3 plays
    expect(dailyChart.tracks[0].trackId).toBe('track-A')
    expect(dailyChart.tracks[0].title).toBe('Song Alpha')
    expect(dailyChart.tracks[0].score).toBe(3)
    expect(dailyChart.tracks[0].rank).toBe(1)

    // Rank 2: Song Beta with 2 plays
    expect(dailyChart.tracks[1].trackId).toBe('track-B')
    expect(dailyChart.tracks[1].score).toBe(2)
    expect(dailyChart.tracks[1].rank).toBe(2)

    // Rank 3: Song Gamma with 1 play
    expect(dailyChart.tracks[2].trackId).toBe('track-C')
    expect(dailyChart.tracks[2].score).toBe(1)
    expect(dailyChart.tracks[2].rank).toBe(3)
  })
})
