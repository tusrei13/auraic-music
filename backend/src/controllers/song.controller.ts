import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const getSongs = async (_req: Request, res: Response) => {
  try {
    const songs = await prisma.song.findMany({
      include: {
        artist: true,
        genre: true,
      },
    })
    res.json(songs)
  } catch (error) {
    res.status(500).json({ error: 'Không thể lấy danh sách bài hát' })
  }
}