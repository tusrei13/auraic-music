import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { sendError, sendInternalError } from '../lib/api-error'

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

export const getAdminSongs = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  try {
    const songs = await prisma.song.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        image: true,
        duration: true,
        playCount: true,
        lyrics: true,
        createdAt: true,
        artist: { select: { name: true } },
        genre: { select: { name: true } },
      },
    })

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
