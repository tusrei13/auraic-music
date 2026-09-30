import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { sendError, sendInternalError } from '../lib/api-error'

export const exportUserData = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  try {
    const userId = req.user.id

    const [user, likes, playlists, histories, analyticsEvents, follows] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, avatar: true, createdAt: true, updatedAt: true, role: true },
      }),
      prisma.like.findMany({
        where: { userId },
        include: { song: { select: { id: true, title: true, image: true, duration: true, artistId: true } } },
      }),
      prisma.playlist.findMany({
        where: { userId },
        include: {
          songs: { include: { song: { select: { id: true, title: true, image: true, duration: true, artistId: true } } } },
        },
      }),
      prisma.listeningHistory.findMany({
        where: { userId },
        include: { song: { select: { id: true, title: true, image: true, duration: true } } },
        orderBy: { listenedAt: 'desc' },
      }),
      prisma.analyticsEvent.findMany({
        where: { userId },
        select: { eventType: true, trackId: true, title: true, source: true, position: true, duration: true, occurredAt: true },
        orderBy: { occurredAt: 'desc' },
        take: 1000,
      }),
      prisma.follow.findMany({
        where: { userId },
        include: { artist: { select: { id: true, name: true, avatar: true } } },
      }),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: user || null,
      likes: likes.map(l => ({ songId: l.songId, song: l.song, createdAt: l.createdAt })),
      playlists: playlists.map(p => ({
        id: p.id,
        name: p.name,
        coverImage: p.coverImage,
        color: p.color,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        songs: p.songs.map(ps => ({ addedAt: ps.addedAt, song: ps.song })),
      })),
      listeningHistory: histories,
      analyticsEvents,
      follows: follows.map(f => ({ artist: f.artist, createdAt: f.createdAt })),
      summary: {
        totalLikes: likes.length,
        totalPlaylists: playlists.length,
        totalHistoryEntries: histories.length,
        totalAnalyticsEvents: analyticsEvents.length,
        totalFollows: follows.length,
      },
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename="auraic-data-export-${userId.slice(0, 8)}.json"`)
    return res.json(exportData)
  } catch {
    return sendInternalError(res, 'EXPORT_USER_DATA_ERROR', 'Không thể xuất dữ liệu người dùng')
  }
}

export const deleteUserData = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Chưa đăng nhập')

  const userId = req.user.id

  try {
    await prisma.$transaction(async (tx) => {
      await tx.analyticsEvent.updateMany({
        where: { userId },
        data: { userId: `anonymized-${userId}` },
      })

      await tx.listeningHistory.deleteMany({ where: { userId } })
      await tx.like.deleteMany({ where: { userId } })
      await tx.follow.deleteMany({ where: { userId } })

      const userPlaylists = await tx.playlist.findMany({ where: { userId }, select: { id: true } })
      for (const playlist of userPlaylists) {
        await tx.playlistSong.deleteMany({ where: { playlistId: playlist.id } })
      }
      await tx.playlist.deleteMany({ where: { userId } })

      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@deleted.local`,
          name: 'Deleted User',
          avatar: null,
          role: 'USER',
        },
      })
    })

    return res.json({ message: 'Đã xóa và ẩn danh dữ liệu người dùng thành công' })
  } catch {
    return sendInternalError(res, 'DELETE_USER_DATA_ERROR', 'Không thể xóa dữ liệu người dùng')
  }
}
