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
const CACHE_TTL_MS = 60_000
const MAX_ATTEMPTS = 3
const cache = new Map<string, { expiresAt: number; tracks: JamendoSong[] }>()

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const resolveJamendoArtistId = async (clientId: string, artistName: string) => {
  const params = new URLSearchParams({ client_id: clientId, format: 'json', limit: '10', namesearch: artistName })
  const response = await fetch(`${JAMENDO_ARTISTS_API_URL}?${params}`, { signal: AbortSignal.timeout(8000) })
  if (!response.ok) return undefined
  const payload = await response.json() as { results?: Array<{ id: number; name: string }> }
  const exact = payload.results?.find((artist) => artist.name.toLowerCase() === artistName.toLowerCase())
  return exact ? String(exact.id) : payload.results?.[0] ? String(payload.results[0].id) : undefined
}

export const getJamendoArtists = async (name: string): Promise<JamendoArtist[]> => {
  const clientId = process.env.JAMENDO_CLIENT_ID
  if (!clientId || !name.trim()) return []

  const params = new URLSearchParams({
    client_id: clientId,
    format: 'json',
    limit: '10',
    namesearch: name.trim(),
    imagesize: '300',
  })
  const response = await fetch(`${JAMENDO_ARTISTS_API_URL}?${params}`, { signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error(`Jamendo artist request failed with ${response.status}`)

  const payload = await response.json() as { headers?: { status?: string; error_message?: string }; results?: Array<{ id: number; name: string; image?: string }> }
  if (payload.headers?.status !== 'success') throw new Error(payload.headers?.error_message || 'Jamendo artist request failed')

  return (payload.results || []).map((artist) => ({
    id: `jamendo:${artist.id}`,
    name: artist.name,
    avatar: artist.image || '',
  }))
}

export const getJamendoTracks = async (options: { limit?: number; offset?: number; tags?: string; search?: string; nameSearch?: string; artistId?: string; artistName?: string; albumId?: string; order?: string } = {}): Promise<JamendoSong[]> => {
  const clientId = process.env.JAMENDO_CLIENT_ID
  if (!clientId) throw new Error('Jamendo is not configured')

  const params = new URLSearchParams({
    client_id: clientId,
    format: 'json',
    limit: String(Math.min(Math.max(options.limit || 24, 1), 200)),
    offset: String(Math.max(options.offset || 0, 0)),
    type: 'single albumtrack',
    order: options.order || 'relevance',
    audioformat: 'mp32',
    imagesize: '300',
    include: 'musicinfo licenses',
  })
  if (options.tags?.trim()) params.set('tags', options.tags.trim().toLowerCase())
  if (options.search?.trim()) params.set('search', options.search.trim())
  if (options.nameSearch?.trim()) params.set('namesearch', options.nameSearch.trim())
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

  if (tracks.length === 0 && !options.tags?.trim() && !options.search?.trim() && params.get('order') !== 'name') {
    params.set('order', 'name')
    cache.delete(cacheKey)
    return getJamendoTracks({ ...options, order: 'name', limit: Number(params.get('limit')), offset: Number(params.get('offset')) })
  }
  if (tracks.length === 0 && options.search?.trim() && !options.nameSearch?.trim()) {
    cache.delete(cacheKey)
    return getJamendoTracks({ ...options, search: undefined, nameSearch: options.search })
  }
  if (tracks.length === 0 && options.tags?.trim()) {
    cache.delete(cacheKey)
    return getJamendoTracks({ ...options, tags: undefined, search: options.tags })
  }
  if (tracks.length > 0) cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, tracks })
  return tracks
}
