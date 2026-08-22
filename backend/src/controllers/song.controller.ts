import { Request, Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { parsePositiveInteger } from '../lib/validation'
import { sendError, sendInternalError } from '../lib/api-error'
import { getJamendoTracks } from '../services/jamendo.service'

export const getSongs = async (_req: Request, res: Response) => {
  try {
    res.json(await getJamendoTracks({ limit: 48 }))
  } catch (error) {
    sendInternalError(res, 'SONG_LIST_ERROR', 'Không thể lấy catalog Jamendo')
  }
}

export const recordListening = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const songId = parsePositiveInteger(req.params.id)
    if (!userId) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')
    if (songId === null) return sendError(res, 400, 'INVALID_SONG_ID', 'songId không hợp lệ')

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

    const history = await prisma.listeningHistory.findMany({
      where: { userId },
      orderBy: { listenedAt: 'desc' },
      take: 50,
      include: { song: { include: { artist: true, genre: true, album: true, mood: true } } },
    })

    res.json(history)
  } catch (error) {
    sendInternalError(res, 'LISTENING_HISTORY_ERROR', 'Không thể lấy lịch sử nghe')
  }
}