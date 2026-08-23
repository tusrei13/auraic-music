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
