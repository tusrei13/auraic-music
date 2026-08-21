import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const getPlaylists = async (_req: Request, res: Response) => {
  try {
    const playlists = await prisma.playlist.findMany({
      include: {
        user: { select: { name: true, avatar: true } },
        songs: { include: { song: { include: { artist: true } } } },
      },
    })
    res.json(playlists)
  } catch (error) {
    res.status(500).json({ error: 'Không thể lấy danh sách playlist' })
  }
}

export const getPlaylistById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        songs: {
          include: {
            song: { include: { artist: true, genre: true } },
          },
        },
      },
    })
    if (!playlist) return res.status(404).json({ error: 'Không tìm thấy playlist' })
    res.json(playlist)
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' })
  }
}