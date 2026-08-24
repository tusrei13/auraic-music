import { Request, Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { parsePositiveInteger } from '../lib/validation'
import { sendError, sendInternalError } from '../lib/api-error'
import { getJamendoTracks } from '../services/jamendo.service'

const LISTENING_DEDUP_WINDOW_MS = 30_000

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

    const [history, jamendoHistory] = await Promise.all([
      prisma.listeningHistory.findMany({
      where: { userId },
      orderBy: { listenedAt: 'desc' },
      take: 50,
      include: { song: { include: { artist: true, genre: true, album: true, mood: true } } },
      }),
      prisma.jamendoListening.findMany({ where: { userId }, orderBy: { listenedAt: 'desc' }, take: 50 }),
    ])

    res.json([
      ...history,
      ...jamendoHistory.map((item) => ({ id: item.id, listenedAt: item.listenedAt, song: { id: item.trackId, title: item.title, artist: item.artistName, image: item.image, audioUrl: item.audioUrl, duration: item.duration } })),
    ].sort((first, second) => second.listenedAt.getTime() - first.listenedAt.getTime()).slice(0, 50))
  } catch (error) {
    sendInternalError(res, 'LISTENING_HISTORY_ERROR', 'Không thể lấy lịch sử nghe')
  }
}

export const recordJamendoListening = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')

    const { trackId, title, artistName, image, audioUrl, duration } = req.body
    const recentListening = await prisma.jamendoListening.findFirst({
      where: { userId, trackId, listenedAt: { gte: new Date(Date.now() - LISTENING_DEDUP_WINDOW_MS) } },
      orderBy: { listenedAt: 'desc' },
    })
    if (recentListening) return res.status(200).json(recentListening)

    const history = await prisma.jamendoListening.create({ data: { userId, trackId, title, artistName, image, audioUrl, duration } })
    res.status(201).json(history)
  } catch {
    sendInternalError(res, 'JAMENDO_LISTENING_ERROR', 'Không thể ghi nhận lịch sử nghe Jamendo')
  }
}