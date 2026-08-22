import 'dotenv/config'

interface JamendoTrack {
  id: number
  name: string
  duration: number
  artist_name: string
  artist_id: number
  album_name?: string
  album_id?: number
  album_image?: string
  image: string
  audio: string
  audiodownload_allowed?: boolean
  license_ccurl?: string
  musicinfo?: { tags?: { genres?: string[] } }
}

interface JamendoResponse {
  headers?: { status?: string; error_message?: string }
  results?: JamendoTrack[]
}

export interface JamendoSong {
  id: string
  title: string
  audioUrl: string
  image: string
  duration: number
  artist: { id: string; name: string; avatar: string }
  album: { id: string; title: string; coverImage: string; artistId: string } | null
  source: 'jamendo'
  licenseUrl?: string
  genres: string[]
}

const JAMENDO_API_URL = 'https://api.jamendo.com/v3.0/tracks/'
const CACHE_TTL_MS = 60_000
const MAX_ATTEMPTS = 3
const cache = new Map<string, { expiresAt: number; tracks: JamendoSong[] }>()

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

export const getJamendoTracks = async (options: { limit?: number; offset?: number; tags?: string; search?: string } = {}) => {
  const clientId = process.env.JAMENDO_CLIENT_ID
  if (!clientId) throw new Error('Jamendo is not configured')

  const params = new URLSearchParams({
    client_id: clientId,
    format: 'json',
    limit: String(Math.min(Math.max(options.limit || 24, 1), 200)),
    offset: String(Math.max(options.offset || 0, 0)),
    type: 'single albumtrack',
    order: 'popularity_month_desc',
    audioformat: 'mp32',
    imagesize: '300',
    include: 'musicinfo licenses',
  })
  if (options.tags?.trim()) params.set('tags', options.tags.trim().toLowerCase())
  if (options.search?.trim()) params.set('search', options.search.trim())

  const cacheKey = params.toString()
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.tracks

  let response: Response | undefined
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      response = await fetch(`${JAMENDO_API_URL}?${params}`, {
        signal: AbortSignal.timeout(8000),
      })
      if (response.ok || (response.status < 500 && response.status !== 429)) break
      lastError = new Error(`Jamendo request failed with ${response.status}`)
    } catch (error) {
      lastError = error
    }
    if (attempt < MAX_ATTEMPTS) await wait(250 * 2 ** (attempt - 1))
  }
  if (!response?.ok) throw lastError instanceof Error ? lastError : new Error('Jamendo request failed')

  const payload = await response.json() as JamendoResponse
  if (payload.headers?.status !== 'success') {
    throw new Error(payload.headers?.error_message || 'Jamendo request failed')
  }

  const tracks = (payload.results || []).filter((track) => track.audio).map((track): JamendoSong => ({
    id: `jamendo:${track.id}`,
    title: track.name,
    audioUrl: track.audio,
    image: track.image || track.album_image || '',
    duration: track.duration,
    artist: {
      id: `jamendo:${track.artist_id}`,
      name: track.artist_name,
      avatar: track.image || track.album_image || '',
    },
    album: track.album_id && track.album_name ? {
      id: `jamendo:${track.album_id}`,
      title: track.album_name,
      coverImage: track.album_image || track.image || '',
      artistId: `jamendo:${track.artist_id}`,
    } : null,
    source: 'jamendo',
    licenseUrl: track.license_ccurl,
    genres: track.musicinfo?.tags?.genres || [],
  }))
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, tracks })
  return tracks
}