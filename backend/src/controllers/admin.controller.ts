import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { sendError, sendInternalError } from '../lib/api-error'
import { getJamendoTracks } from '../services/jamendo.service'

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
      prisma.jamendoListening.findMany({ select: { trackId: true } }),
    ])
    const playCounts = new Map<string, number>()
    for (const event of events) playCounts.set(event.trackId, (playCounts.get(event.trackId) || 0) + 1)
    const songs = tracks.map((track) => ({
      id: track.id,
      title: track.title,
      image: track.image,
      duration: track.duration,
      playCount: playCounts.get(track.id) || 0,
      lyrics: null,
      createdAt: null,
      artist: { name: track.artist.name },
      genre: track.genres[0] ? { name: track.genres[0] } : null,
    }))

    return res.json({ songs })
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
        _count: { select: { songs: true } },
      },
    })

    return res.json({ playlists })
  } catch {
    return sendInternalError(res, 'ADMIN_PLAYLISTS_ERROR', 'Không thể tải danh sách playlist')
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
