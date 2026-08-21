import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const getArtists = async (_req: Request, res: Response) => {
  try {
    const artists = await prisma.artist.findMany({
      include: { _count: { select: { songs: true } } },
    })
    res.json(artists)
  } catch (error) {
    res.status(500).json({ error: 'Không thể lấy danh sách nghệ sĩ' })
  }
}

export const getArtistById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: { songs: { include: { genre: true } } },
    })
    if (!artist) return res.status(404).json({ error: 'Không tìm thấy nghệ sĩ' })
    res.json(artist)
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' })
  }
}