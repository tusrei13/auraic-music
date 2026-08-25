import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { parsePositiveInteger } from '../lib/validation'
import { sendError, sendInternalError } from '../lib/api-error'

export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { songId, title, artistName, image, audioUrl, duration, licenseUrl } = req.body

    if (!userId) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')
    if (String(songId).startsWith('jamendo:')) {
      if (!title || !artistName || !image || !audioUrl) return sendError(res, 400, 'INVALID_JAMENDO_LIKE', 'Thiếu metadata bài hát Jamendo')
      const trackId = String(songId)
      const existing = await prisma.jamendoLike.findUnique({ where: { userId_trackId: { userId, trackId } } })
      if (existing) {
        await prisma.jamendoLike.delete({ where: { userId_trackId: { userId, trackId } } })
        return res.json({ liked: false, trackId })
      }
      await prisma.jamendoLike.create({ data: { userId, trackId, title, artistName, image, audioUrl, duration, licenseUrl } })
      return res.json({ liked: true, trackId })
    }
    const numericSongId = parsePositiveInteger(songId)
    if (numericSongId === null) {
      return sendError(res, 400, 'INVALID_SONG_ID', 'songId không hợp lệ')
    }

    const song = await prisma.song.findUnique({ where: { id: numericSongId } })
    if (!song) return sendError(res, 404, 'SONG_NOT_FOUND', 'Không tìm thấy bài hát')

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_songId: { userId, songId: numericSongId },
      },
    })

    if (existingLike) {
      await prisma.like.delete({
        where: {
          userId_songId: { userId, songId: numericSongId },
        },
      })
      return res.json({ liked: false, message: 'Đã bỏ yêu thích bài hát' })
    } else {
      await prisma.like.create({
        data: { userId, songId: numericSongId },
      })
      return res.json({ liked: true, message: 'Đã thêm bài hát vào danh sách yêu thích' })
    }
  } catch (error) {
    sendInternalError(res, 'LIKE_TOGGLE_ERROR', 'Lỗi khi thả tim bài hát')
  }
}

export const getMyLikes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')

    const [likes, jamendoLikes] = await Promise.all([prisma.like.findMany({
      where: { userId },
      include: {
        song: { include: { artist: true, genre: true } },
      },
      orderBy: { createdAt: 'desc' },
    }), prisma.jamendoLike.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })])

    res.json([
      ...likes,
      ...jamendoLikes.map((like) => ({
        id: `${like.userId}:${like.trackId}`,
        createdAt: like.createdAt,
        song: { id: like.trackId, title: like.title, artist: like.artistName, image: like.image, audioUrl: like.audioUrl, duration: like.duration, licenseUrl: like.licenseUrl, source: 'jamendo' },
      })),
    ])
  } catch (error) {
    sendInternalError(res, 'LIKE_LIST_ERROR', 'Không thể lấy danh sách yêu thích')
  }
}
