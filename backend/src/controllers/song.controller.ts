import { Request, Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { parsePositiveInteger } from '../lib/validation'
import { sendError, sendInternalError } from '../lib/api-error'

const LISTENING_DEDUP_WINDOW_MS = 30_000

export const recordListening = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const songId = parsePositiveInteger(req.params.id)
    if (!userId) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')
    if (songId === null) return sendError(res, 400, 'INVALID_SONG_ID', 'songId không hợp lệ')

    const recentListening = await prisma.listeningHistory.findFirst({
      where: { userId, songId, listenedAt: { gte: new Date(Date.now() - LISTENING_DEDUP_WINDOW_MS) } },
      orderBy: { listenedAt: 'desc' },
    })
    if (recentListening) return res.status(200).json(recentListening)

    const song = await prisma.song.findUnique({ where: { id: songId } })
    if (!song) return sendError(res, 404, 'SONG_NOT_FOUND', 'Không tìm thấy bài hát')

    const [history] = await prisma.$transaction([
      prisma.listeningHistory.create({ data: { userId, songId } }),
      prisma.song.update({
        where: { id: songId },
        data: { playCount: { increment: 1 } },
      }),
    ])

    res.status(201).json(history)
  } catch (error) {
    sendInternalError(res, 'LISTENING_RECORD_ERROR', 'Không thể ghi nhận lịch sử nghe')
  }
}

export const getListeningHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100)
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined

    const history = await prisma.listeningHistory.findMany({
      where: { userId },
      orderBy: { listenedAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      include: { song: { include: { artist: true, genre: true, album: true, mood: true } } },
    })

    const hasMore = history.length > limit
    const page = history.slice(0, limit)
    if (hasMore) res.setHeader('x-next-cursor', page[page.length - 1]?.id || '')
    res.json(page)
  } catch (error) {
    sendInternalError(res, 'LISTENING_HISTORY_ERROR', 'Không thể lấy lịch sử nghe')
  }
}
