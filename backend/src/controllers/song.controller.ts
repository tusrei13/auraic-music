import { Request, Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { parsePositiveInteger } from '../lib/validation'

export const getSongs = async (_req: Request, res: Response) => {
  try {
    const songs = await prisma.song.findMany({
      include: {
        artist: true,
        genre: true,
        album: true,
        mood: true,
      },
    })
    res.json(songs)
  } catch (error) {
    res.status(500).json({ error: 'Không thể lấy danh sách bài hát' })
  }
}

export const recordListening = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const songId = parsePositiveInteger(req.params.id)
    if (!userId) return res.status(401).json({ error: 'Yêu cầu đăng nhập' })
    if (songId === null) return res.status(400).json({ error: 'songId không hợp lệ' })

    const song = await prisma.song.findUnique({ where: { id: songId } })
    if (!song) return res.status(404).json({ error: 'Không tìm thấy bài hát' })

    const [history] = await prisma.$transaction([
      prisma.listeningHistory.create({ data: { userId, songId } }),
      prisma.song.update({
        where: { id: songId },
        data: { playCount: { increment: 1 } },
      }),
    ])

    res.status(201).json(history)
  } catch (error) {
    res.status(500).json({ error: 'Không thể ghi nhận lịch sử nghe' })
  }
}

export const getListeningHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Yêu cầu đăng nhập' })

    const history = await prisma.listeningHistory.findMany({
      where: { userId },
      orderBy: { listenedAt: 'desc' },
      take: 50,
      include: { song: { include: { artist: true, genre: true, album: true, mood: true } } },
    })

    res.json(history)
  } catch (error) {
    res.status(500).json({ error: 'Không thể lấy lịch sử nghe' })
  }
}