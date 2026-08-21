import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'

export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { songId } = req.body

    if (!userId) return res.status(401).json({ error: 'Yêu cầu đăng nhập' })
    if (!songId) return res.status(400).json({ error: 'Thiếu songId' })

    const numericSongId = Number(songId)

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
    res.status(500).json({ error: 'Lỗi khi thả tim bài hát' })
  }
}

export const getMyLikes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Yêu cầu đăng nhập' })

    const likes = await prisma.like.findMany({
      where: { userId },
      include: {
        song: { include: { artist: true, genre: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(likes)
  } catch (error) {
    res.status(500).json({ error: 'Không thể lấy danh sách yêu thích' })
  }
}