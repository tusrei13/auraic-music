interface LrclibResponse {
  syncedLyrics?: string | null
  plainLyrics?: string | null
}

export interface LyricsResult {
  syncedLyrics: string | null
  plainLyrics: string | null
}

const cache = new Map<string, { expiresAt: number; result: LyricsResult }>()
const CACHE_TTL_MS = 60 * 60 * 1000

export const getLyrics = async (trackName: string, artistName: string): Promise<LyricsResult> => {
  const normalizedTrack = trackName.trim()
  const normalizedArtist = artistName.trim()
  if (!normalizedTrack || !normalizedArtist) return { syncedLyrics: null, plainLyrics: null }

  const cacheKey = `${normalizedTrack.toLowerCase()}::${normalizedArtist.toLowerCase()}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.result

  const params = new URLSearchParams({
    track_name: normalizedTrack,
    artist_name: normalizedArtist,
  })
  const response = await fetch(`https://lrclib.net/api/get?${params}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  })

  if (response.status === 404) {
    const empty = { syncedLyrics: null, plainLyrics: null }
    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, result: empty })
    return empty
  }
  if (!response.ok) throw new Error(`LRCLIB request failed with ${response.status}`)

  const payload = await response.json() as LrclibResponse
  const result = {
    syncedLyrics: payload.syncedLyrics || null,
    plainLyrics: payload.plainLyrics || null,
  }
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, result })
  return result
}
