import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { sendError, sendInternalError } from '../lib/api-error'
import { getJamendoTracks } from '../services/jamendo.service'

type AnalyticsEventForSummary = {
  userId?: string
  eventType: 'TRACK_STARTED' | 'TRACK_COMPLETED' | 'TRACK_SKIPPED'
  trackId: string
  title: string
  source?: string
  position?: number | null
  duration?: number | null
  occurredAt: Date
}

export const assessAnalyticsQuality = (events: AnalyticsEventForSummary[]) => {
  let invalidTitle = 0
  let invalidTiming = 0
  let unknownSource = 0
  let duplicateStarted = 0
  const recentStarts = new Map<string, number>()

  for (const event of events) {
    if (!event.title.trim()) invalidTitle += 1
    if ((event.position !== null && event.position !== undefined && event.position < 0) || (event.duration !== null && event.duration !== undefined && event.duration < 0) || (event.position !== null && event.position !== undefined && event.duration !== null && event.duration !== undefined && event.position > event.duration)) invalidTiming += 1
    if (event.source !== 'jamendo' && event.source !== 'local') unknownSource += 1
    if (event.eventType === 'TRACK_STARTED') {
      const key = `${event.userId || 'unknown'}:${event.trackId}`
      const previous = recentStarts.get(key)
      if (previous !== undefined && event.occurredAt.getTime() - previous <= 30_000) duplicateStarted += 1
      recentStarts.set(key, event.occurredAt.getTime())
    }
  }

  return { invalidTitle, invalidTiming, unknownSource, duplicateStarted, totalIssues: invalidTitle + invalidTiming + unknownSource + duplicateStarted }
}

export const summarizeAnalyticsEvents = (events: AnalyticsEventForSummary[], days = 7) => {
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  const daily = new Map<string, { date: string; started: number; completed: number; skipped: number }>()

  for (let index = 0; index < days; index += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = date.toISOString().slice(0, 10)
    daily.set(key, { date: key, started: 0, completed: 0, skipped: 0 })
  }

  const topTracks = new Map<string, { trackId: string; title: string; plays: number }>()
  let started = 0
  let completed = 0
  let skipped = 0

  for (const event of events) {
    const dateKey = event.occurredAt.toISOString().slice(0, 10)
    const bucket = daily.get(dateKey)
    if (bucket) bucket[event.eventType === 'TRACK_STARTED' ? 'started' : event.eventType === 'TRACK_COMPLETED' ? 'completed' : 'skipped'] += 1
    if (event.eventType === 'TRACK_STARTED') {
      started += 1
      const current = topTracks.get(event.trackId)
      if (current) current.plays += 1
      else topTracks.set(event.trackId, { trackId: event.trackId, title: event.title, plays: 1 })
    } else if (event.eventType === 'TRACK_COMPLETED') completed += 1
    else skipped += 1
  }

  return {
    periodDays: days,
    totals: { started, completed, skipped },
    daily: [...daily.values()],
    topTracks: [...topTracks.values()].sort((first, second) => second.plays - first.plays).slice(0, 10),
    quality: assessAnalyticsQuality(events),
  }
}

export const getAdminAnalytics = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  try {
    const since = new Date()
    since.setDate(since.getDate() - 6)
    since.setHours(0, 0, 0, 0)
    const events = await prisma.analyticsEvent.findMany({
      where: { occurredAt: { gte: since } },
      orderBy: { occurredAt: 'asc' },
      select: { userId: true, eventType: true, trackId: true, title: true, source: true, position: true, duration: true, occurredAt: true },
    })
    return res.json(summarizeAnalyticsEvents(events))
  } catch {
    return sendInternalError(res, 'ADMIN_ANALYTICS_ERROR', 'Không thể tải dữ liệu analytics')
  }
}

export const getAdminOverview = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  try {
    const [users, playlists, songs, likes] = await Promise.all([
      prisma.user.count(),
      prisma.playlist.count(),
      prisma.song.count(),
      prisma.like.count(),
    ])

    return res.json({
      role: req.user.role,
      metrics: { users, playlists, songs, likes },
    })
  } catch {
    return sendInternalError(res, 'ADMIN_OVERVIEW_ERROR', 'Không thể tải tổng quan quản trị')
  }
}

export const getAdminUsers = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { playlists: true, likes: true, histories: true } },
      },
    })

    return res.json({ users })
  } catch {
    return sendInternalError(res, 'ADMIN_USERS_ERROR', 'Không thể tải danh sách người dùng')
  }
}

export const updateAdminUserRole = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')
  if (req.user.id === req.params.id) return sendError(res, 400, 'SELF_ROLE_CHANGE_FORBIDDEN', 'Không thể tự thay đổi quyền của chính mình')

  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: req.body.role },
      select: { id: true, email: true, name: true, role: true },
    })
    return res.json({ user })
  } catch {
    return sendError(res, 404, 'ADMIN_USER_NOT_FOUND', 'Không tìm thấy người dùng')
  }
}

export const getAdminSongs = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  try {
    const [tracks, events] = await Promise.all([
      getJamendoTracks({ limit: 50, order: 'name' }),
      prisma.jamendoListening.findMany({
        orderBy: { listenedAt: 'desc' },
        take: 5000,
        select: { trackId: true, title: true, artistName: true, image: true, audioUrl: true, duration: true },
      }),
    ])

    const playCounts = new Map<string, number>()
    const listenedTracksMap = new Map<string, { id: string; title: string; image: string; duration: number | null; artistName: string; audioUrl: string }>()

    for (const event of events) {
      const rawId = event.trackId
      const cleanId = rawId.replace(/^jamendo:/, '')
      const fullId = rawId.startsWith('jamendo:') ? rawId : `jamendo:${rawId}`

      playCounts.set(rawId, (playCounts.get(rawId) || 0) + 1)
      if (cleanId !== rawId) playCounts.set(cleanId, (playCounts.get(cleanId) || 0) + 1)
      if (fullId !== rawId) playCounts.set(fullId, (playCounts.get(fullId) || 0) + 1)

      if (!listenedTracksMap.has(fullId)) {
        listenedTracksMap.set(fullId, {
          id: fullId,
          title: event.title,
          image: event.image,
          duration: event.duration,
          artistName: event.artistName,
          audioUrl: event.audioUrl,
        })
      }
    }

    const mapTrack = (t: { id: string; title: string; image: string; duration: number | null; artist: { name: string } | string; genres?: string[] }) => {
      const fullId = t.id.startsWith('jamendo:') ? t.id : `jamendo:${t.id}`
      const cleanId = t.id.replace(/^jamendo:/, '')
      const count = Math.max(playCounts.get(t.id) || 0, playCounts.get(fullId) || 0, playCounts.get(cleanId) || 0)
      const artistName = typeof t.artist === 'string' ? t.artist : t.artist?.name || 'Unknown'
      const genreName = t.genres?.[0] ? t.genres[0] : null
      return {
        id: fullId,
        title: t.title,
        image: t.image,
        duration: t.duration || 0,
        playCount: count,
        lyrics: null,
        createdAt: null,
        artist: { name: artistName },
        genre: genreName ? { name: genreName } : null,
      }
    }

    const catalogSongs = tracks.map(mapTrack)
    const existingIds = new Set(catalogSongs.map((s) => s.id))
    const listenedSongs: ReturnType<typeof mapTrack>[] = []

    for (const [id, item] of listenedTracksMap.entries()) {
      if (!existingIds.has(id)) {
        listenedSongs.push(mapTrack({ id: item.id, title: item.title, image: item.image, duration: item.duration, artist: { name: item.artistName } }))
      }
    }

    const allSongs = [...listenedSongs, ...catalogSongs].sort((first, second) => second.playCount - first.playCount)

    return res.json({ songs: allSongs })
  } catch {
    return sendInternalError(res, 'ADMIN_SONGS_ERROR', 'Không thể tải thư viện bài hát')
  }
}

export const getAdminPlaylists = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  try {
    const playlists = await prisma.playlist.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { name: true, email: true } },
        _count: { select: { songs: true, jamendoSongs: true } },
      },
    })

    const mappedPlaylists = playlists.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      user: p.user,
      _count: {
        songs: (p._count?.songs || 0) + (p._count?.jamendoSongs || 0),
      },
    }))

    return res.json({ playlists: mappedPlaylists })
  } catch {
    return sendInternalError(res, 'ADMIN_PLAYLISTS_ERROR', 'Không thể tải danh sách playlist')
  }
}

export const deleteAdminPlaylist = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  try {
    const playlist = await prisma.playlist.delete({
      where: { id: req.params.id },
    })
    return res.json({ message: 'Đã xóa playlist', playlistId: playlist.id })
  } catch {
    return sendError(res, 404, 'PLAYLIST_NOT_FOUND', 'Không tìm thấy playlist để xóa')
  }
}

export const getAdminTopJamendo = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  try {
    const events = await prisma.jamendoListening.findMany({ orderBy: { listenedAt: 'desc' }, take: 5000 })
    const grouped = new Map<string, { trackId: string; title: string; artistName: string; image: string; plays: number }>()
    for (const event of events) {
      const current = grouped.get(event.trackId)
      if (current) current.plays += 1
      else grouped.set(event.trackId, { trackId: event.trackId, title: event.title, artistName: event.artistName, image: event.image, plays: 1 })
    }

    return res.json({ songs: [...grouped.values()].sort((first, second) => second.plays - first.plays).slice(0, 5) })
  } catch {
    return sendInternalError(res, 'ADMIN_TOP_SONGS_ERROR', 'Không thể tải báo cáo bài hát phổ biến')
  }
}

export const getAdminArtists = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  try {
    const tracks = await getJamendoTracks({ limit: 200, order: 'name' })
    const artistsById = new Map<string, { id: string; name: string; avatar: string; trackCount: number; albumIds: Set<string> }>()
    for (const track of tracks) {
      const artist = artistsById.get(track.artist.id) || { id: track.artist.id, name: track.artist.name, avatar: track.artist.avatar, trackCount: 0, albumIds: new Set<string>() }
      artist.trackCount += 1
      if (track.album?.id) artist.albumIds.add(track.album.id)
      artistsById.set(track.artist.id, artist)
    }

    const artists = [...artistsById.values()]
      .sort((first, second) => second.trackCount - first.trackCount || first.name.localeCompare(second.name))
      .slice(0, 50)
      .map(({ albumIds, ...artist }) => ({ ...artist, albumCount: albumIds.size }))

    return res.json({ artists })
  } catch {
    return sendInternalError(res, 'ADMIN_ARTISTS_ERROR', 'Không thể tải danh sách nghệ sĩ')
  }
}
