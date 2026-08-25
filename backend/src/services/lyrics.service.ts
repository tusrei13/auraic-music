import { cacheGet, cacheSet } from '../lib/redis'
import { logger } from '../lib/logger'

interface LrclibResponse {
  syncedLyrics?: string | null
  plainLyrics?: string | null
}

export interface LyricsResult {
  syncedLyrics: string | null
  plainLyrics: string | null
}

const LYRICS_CACHE_TTL_SECONDS = 86400 // 24 hours

export const getLyrics = async (trackName: string, artistName: string): Promise<LyricsResult> => {
  const normalizedTrack = trackName.trim()
  const normalizedArtist = artistName.trim()
  if (!normalizedTrack || !normalizedArtist) return { syncedLyrics: null, plainLyrics: null }

  const cacheKey = `lyrics:${normalizedTrack.toLowerCase()}::${normalizedArtist.toLowerCase()}`
  
  // 1. Check Redis / In-memory Cache first
  const cached = await cacheGet<LyricsResult>(cacheKey)
  if (cached) {
    logger.debug(`Lyrics cache hit for '${trackName} - ${artistName}'`)
    return cached
  }

  const params = new URLSearchParams({
    track_name: normalizedTrack,
    artist_name: normalizedArtist,
  })

  try {
    const response = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    })

    if (response.status === 404) {
      const empty: LyricsResult = { syncedLyrics: null, plainLyrics: null }
      await cacheSet(cacheKey, empty, LYRICS_CACHE_TTL_SECONDS)
      return empty
    }

    if (!response.ok) throw new Error(`LRCLIB request failed with ${response.status}`)

    const payload = await response.json() as LrclibResponse
    const result: LyricsResult = {
      syncedLyrics: payload.syncedLyrics || null,
      plainLyrics: payload.plainLyrics || null,
    }

    // Cache successful lyrics in Redis
    await cacheSet(cacheKey, result, LYRICS_CACHE_TTL_SECONDS)
    return result
  } catch (error) {
    logger.warn('Failed to fetch lyrics from LRCLIB', undefined, { error })
    return { syncedLyrics: null, plainLyrics: null }
  }
}
