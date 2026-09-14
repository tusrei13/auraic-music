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

    let payload: LrclibResponse | null = null

    if (response.ok) {
      payload = (await response.json()) as LrclibResponse
    } else if (response.status === 404) {
      // 2. Fallback: Search with cleaned track name and artist name
      const cleanTrack = normalizedTrack
        .replace(/\s*[\(\[][^\)\]]*(?:feat|ft|remix|edit|version|remaster|live|official|audio)[^\)\]]*[\)\]]/gi, '')
        .trim()
      const searchParams = new URLSearchParams({
        q: `${cleanTrack} ${normalizedArtist}`,
      })

      const searchRes = await fetch(`https://lrclib.net/api/search?${searchParams}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      })

      if (searchRes.ok) {
        const searchResults = (await searchRes.json()) as LrclibResponse[]
        if (Array.isArray(searchResults) && searchResults.length > 0) {
          const match = searchResults.find((item) => item.syncedLyrics || item.plainLyrics) || searchResults[0]
          payload = match
        }
      }
    }

    if (!payload || (!payload.syncedLyrics && !payload.plainLyrics)) {
      const empty: LyricsResult = { syncedLyrics: null, plainLyrics: null }
      await cacheSet(cacheKey, empty, LYRICS_CACHE_TTL_SECONDS)
      return empty
    }

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
