import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { sendError, sendInternalError } from '../lib/api-error'
import { summarizeAnalyticsEvents } from '../services/analytics.service'

const logAdminAction = async (req: AuthRequest, action: string, targetType?: string, targetId?: string, changes?: unknown) => {
  if (!req.user) return
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: req.user.id,
        action,
        targetType,
        targetId,
        changes: changes as any,
        ipAddress: typeof req.ip === 'string' ? req.ip.slice(0, 45) : undefined,
        userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 200) : undefined,
      },
    })
  } catch {
    // Never fail the request due to audit logging errors
  }
}

export const getAdminAnalytics = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  try {
    const since = new Date()
    since.setDate(since.getDate() - 6)
    since.setUTCHours(0, 0, 0, 0)
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
    const previousRole = await prisma.user.findUnique({ where: { id: req.params.id }, select: { role: true } })
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: req.body.role },
      select: { id: true, email: true, name: true, role: true },
    })
    await logAdminAction(req, 'UPDATE_USER_ROLE', 'User', user.id, { previousRole: previousRole?.role ?? null, newRole: user.role })
    return res.json({ user })
  } catch {
    return sendError(res, 404, 'ADMIN_USER_NOT_FOUND', 'Không tìm thấy người dùng')
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

    const mappedPlaylists = playlists.map((p) => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      user: p.user,
      _count: {
        songs: p._count?.songs || 0,
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
    await logAdminAction(req, 'DELETE_PLAYLIST', 'Playlist', playlist.id, { name: playlist.name })
    return res.json({ message: 'Đã xóa playlist', playlistId: playlist.id })
  } catch {
    return sendError(res, 404, 'PLAYLIST_NOT_FOUND', 'Không tìm thấy playlist để xóa')
  }
}

export const getSystemSettings = async (_req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } })
    return res.json({ settings: Object.fromEntries(settings.map((item) => [item.key, item.value])) })
  } catch {
    return res.json({ settings: { siteName: 'Auraic', defaultLanguage: 'vi', maintenanceMode: 'off' }, degraded: true })
  }
}

export const updateSystemSettings = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')
  const input = req.body as Record<string, unknown>
  const allowed = ['siteName', 'defaultLanguage', 'maintenanceMode']
  const entries = Object.entries(input).filter(([key, value]) => allowed.includes(key) && typeof value === 'string')
  try {
    await prisma.$transaction(entries.map(([key, value]) => prisma.systemSetting.upsert({ where: { key }, create: { key, value: value as string, updatedById: req.user!.id }, update: { value: value as string, updatedById: req.user!.id } })))
    await logAdminAction(req, 'UPDATE_SETTINGS', 'SystemSetting', undefined, Object.fromEntries(entries))
    return getSystemSettings(req, res)
  } catch {
    return sendInternalError(res, 'ADMIN_SETTINGS_WRITE_ERROR', 'Không thể lưu system settings')
  }
}

export const updateSongLyrics = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  try {
    const songId = Number(req.params.id)
    const lyrics = req.body.lyrics

    const song = await prisma.song.update({
      where: { id: songId },
      data: { lyrics: lyrics as any },
      select: { id: true, title: true, lyrics: true },
    })

    await logAdminAction(req, 'UPDATE_SONG_LYRICS', 'Song', String(song.id), { title: song.title, lyricsUpdated: true })

    return res.json({ id: song.id, title: song.title, lyrics: song.lyrics })
  } catch {
    return sendError(res, 404, 'SONG_NOT_FOUND', 'Không tìm thấy bài hát')
  }
}
