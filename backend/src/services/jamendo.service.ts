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

export interface JamendoArtist {
  id: string
  name: string
  avatar: string
}

const JAMENDO_API_URL = 'https://api.jamendo.com/v3.0/tracks/'
const JAMENDO_ARTISTS_API_URL = 'https://api.jamendo.com/v3.0/artists/'
const CACHE_TTL_MS = 300_000 // 5 minutes cache
const MAX_ATTEMPTS = 3
const REQUEST_TIMEOUT_MS = 15_000 // 15 seconds timeout
const cache = new Map<string, { expiresAt: number; tracks: JamendoSong[] }>()

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const resolveJamendoArtistId = async (clientId: string, artistName: string) => {
  const trimmed = artistName?.trim()
  if (!trimmed || trimmed.length < 2) return undefined
  const params = new URLSearchParams({ client_id: clientId, format: 'json', limit: '10', namesearch: trimmed })
  try {
    const response = await fetch(`${JAMENDO_ARTISTS_API_URL}?${params}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
    if (!response.ok) return undefined
    const payload = await response.json() as { results?: Array<{ id: number; name: string }> }
    const exact = payload.results?.find((artist) => artist.name.toLowerCase() === trimmed.toLowerCase())
    return exact ? String(exact.id) : payload.results?.[0] ? String(payload.results[0].id) : undefined
  } catch {
    return undefined
  }
}

export const getJamendoArtists = async (name: string): Promise<JamendoArtist[]> => {
  const clientId = process.env.JAMENDO_CLIENT_ID
  const trimmed = name?.trim()
  if (!clientId || !trimmed || trimmed.length < 2) return []

  const params = new URLSearchParams({
    client_id: clientId,
    format: 'json',
    limit: '10',
    namesearch: trimmed,
    imagesize: '300',
  })
  try {
    const response = await fetch(`${JAMENDO_ARTISTS_API_URL}?${params}`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
    if (!response.ok) return []

    const payload = await response.json() as { headers?: { status?: string; error_message?: string }; results?: Array<{ id: number; name: string; image?: string }> }
    if (payload.headers?.status !== 'success') return []

    return (payload.results || []).map((artist) => ({
      id: `jamendo:${artist.id}`,
      name: artist.name,
      avatar: artist.image || '',
    }))
  } catch {
    return []
  }
}

export const getJamendoTracks = async (options: { limit?: number; offset?: number; tags?: string; search?: string; nameSearch?: string; artistId?: string; artistName?: string; albumId?: string; order?: string } = {}): Promise<JamendoSong[]> => {
  const clientId = process.env.JAMENDO_CLIENT_ID
  if (!clientId) throw new Error('Jamendo is not configured')

  const hasSearchQuery = Boolean(options.search?.trim() || options.nameSearch?.trim())
  const defaultOrder = hasSearchQuery ? 'relevance' : 'popularity_total'
  const selectedOrder = options.order || defaultOrder

  const params = new URLSearchParams({
    client_id: clientId,
    format: 'json',
    limit: String(Math.min(Math.max(options.limit || 24, 1), 200)),
    offset: String(Math.max(options.offset || 0, 0)),
    type: 'single albumtrack',
    order: selectedOrder,
    audioformat: 'mp32',
    imagesize: '300',
    include: 'musicinfo licenses',
  })
  if (options.tags?.trim()) params.set('tags', options.tags.trim().toLowerCase())
  if (options.search?.trim()) params.set('search', options.search.trim())
  if (options.nameSearch?.trim() && options.nameSearch.trim().length >= 2) params.set('namesearch', options.nameSearch.trim())
  const resolvedArtistId = options.artistId?.trim()
    ? options.artistId.replace(/^jamendo:/, '')
    : options.artistName?.trim()
      ? await resolveJamendoArtistId(clientId, options.artistName.trim())
      : undefined
  if (resolvedArtistId) params.set('artist_id', resolvedArtistId)
  if (options.albumId?.trim()) params.set('album_id', options.albumId.replace(/^jamendo:/, ''))

  const cacheKey = params.toString()
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.tracks

  let response: Response | undefined
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      response = await fetch(`${JAMENDO_API_URL}?${params}`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      if (response.ok) break
      const status = response.status
      lastError = new Error(`Jamendo request failed with ${status}`)
      if (status === 429 || (status >= 400 && status < 500)) break
    } catch (error) {
      lastError = error
    }
    if (attempt < MAX_ATTEMPTS) await wait(300 * 2 ** (attempt - 1))
  }

  // If request failed but we have stale cached data, return stale cache gracefully
  if (!response?.ok) {
    if (cached && cached.tracks.length > 0) {
      return cached.tracks
    }
    throw lastError instanceof Error ? lastError : new Error('Jamendo request failed')
  }

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

  if (tracks.length > 0) cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, tracks })
  return tracks
}
