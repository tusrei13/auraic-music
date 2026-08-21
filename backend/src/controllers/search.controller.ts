import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const searchAll = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || ''
    if (!q.trim()) {
      return res.json({ songs: [], artists: [], playlists: [] })
    }

    const [songs, artists, playlists] = await Promise.all([
      prisma.song.findMany({
        where: { title: { contains: q, mode: 'insensitive' } },
        include: { artist: true },
      }),
      prisma.artist.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
      }),
      prisma.playlist.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
      }),
    ])

    res.json({ songs, artists, playlists })
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi tìm kiếm' })
  }
}