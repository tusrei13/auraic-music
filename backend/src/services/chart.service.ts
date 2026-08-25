import { cacheZIncrBy, cacheZRevRangeWithScores, cacheGet, cacheSet } from '../lib/redis'
import { getJamendoTracks, JamendoSong } from './jamendo.service'
import { logger } from '../lib/logger'

export interface ChartTrackItem {
  rank: number
  trackId: string
  title: string
  artistName: string
  image: string
  audioUrl: string
  duration?: number | null
  score: number // Play count in current period
}

function getDailyChartKey(): string {
  const today = new Date().toISOString().slice(0, 10)
  return `chart:daily:${today}`
}

function getWeeklyChartKey(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  // Calculate ISO week number
  const startOfYear = new Date(Date.UTC(year, 0, 1))
  const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000
  const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getUTCDay() + 1) / 7)
  return `chart:weekly:${year}-W${weekNumber}`
}

export async function recordTrackPlayInChart(track: {
  id: string
  title: string
  artistName: string
  image?: string
  audioUrl?: string
  duration?: number | null
}): Promise<void> {
  const trackId = String(track.id)
  const dailyKey = getDailyChartKey()
  const weeklyKey = getWeeklyChartKey()
  const allTimeKey = 'chart:alltime'

  // Increment play counts in parallel
  await Promise.all([
    cacheZIncrBy(dailyKey, trackId, 1),
    cacheZIncrBy(weeklyKey, trackId, 1),
    cacheZIncrBy(allTimeKey, trackId, 1),
    // Cache track metadata with 7 days TTL for fast chart rendering
    cacheSet(`track:meta:${trackId}`, {
      title: track.title,
      artistName: track.artistName,
      image: track.image || '',
      audioUrl: track.audioUrl || '',
      duration: track.duration || 0
    }, 7 * 86400)
  ])

  logger.debug(`Incremented chart score for track '${track.title}' (${trackId})`)
}

export async function getPublicChart(
  period: 'daily' | 'weekly' | 'alltime' = 'weekly',
  limit = 20
): Promise<{ period: string; chartKey: string; totalTracks: number; tracks: ChartTrackItem[] }> {
  let chartKey = getWeeklyChartKey()
  if (period === 'daily') chartKey = getDailyChartKey()
  else if (period === 'alltime') chartKey = 'chart:alltime'

  const topScored = await cacheZRevRangeWithScores(chartKey, 0, limit - 1)

  // If chart is empty (e.g. fresh environment), fallback to Jamendo trending tracks
  if (topScored.length === 0) {
    const trendingTracks = await getJamendoTracks({ limit, order: 'popularity_week' })
    const tracks: ChartTrackItem[] = trendingTracks.map((t, idx) => ({
      rank: idx + 1,
      trackId: t.id,
      title: t.title,
      artistName: t.artist.name,
      image: t.image,
      audioUrl: t.audioUrl,
      duration: t.duration,
      score: Math.max(10, 100 - idx * 4)
    }))

    return {
      period,
      chartKey,
      totalTracks: tracks.length,
      tracks
    }
  }

  // Hydrate metadata for top scored tracks
  const tracks: ChartTrackItem[] = []
  for (let i = 0; i < topScored.length; i++) {
    const item = topScored[i]
    const meta = await cacheGet<{ title: string; artistName: string; image: string; audioUrl: string; duration: number }>(`track:meta:${item.member}`)

    tracks.push({
      rank: i + 1,
      trackId: item.member,
      title: meta?.title || `Track ${item.member}`,
      artistName: meta?.artistName || 'Unknown Artist',
      image: meta?.image || '',
      audioUrl: meta?.audioUrl || '',
      duration: meta?.duration || 0,
      score: item.score
    })
  }

  return {
    period,
    chartKey,
    totalTracks: tracks.length,
    tracks
  }
}
