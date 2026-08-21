import { Request, Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
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

// Tạo Playlist mới
export const createPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { name, coverImage, color } = req.body

    if (!userId) return res.status(401).json({ error: 'Yêu cầu đăng nhập' })
    if (!name) return res.status(400).json({ error: 'Tên playlist là bắt buộc' })

    const newPlaylist = await prisma.playlist.create({
      data: { name, coverImage, color, userId },
    })

    res.status(201).json(newPlaylist)
  } catch (error) {
    res.status(500).json({ error: 'Không thể tạo playlist' })
  }
}

// Thêm bài hát vào Playlist
export const addSongToPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id: playlistId } = req.params
    const { songId } = req.body

    if (!userId) return res.status(401).json({ error: 'Yêu cầu đăng nhập' })
    if (!songId) return res.status(400).json({ error: 'Thiếu songId' })

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } })
    if (!playlist || playlist.userId !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa playlist này' })
    }

    const playlistSong = await prisma.playlistSong.create({
      data: { playlistId, songId: Number(songId) },
    })

    res.status(201).json(playlistSong)
  } catch (error) {
    res.status(500).json({ error: 'Không thể thêm bài hát vào playlist' })
  }
}

// Xóa bài hát khỏi Playlist
export const removeSongFromPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id: playlistId, songId } = req.params

    if (!userId) return res.status(401).json({ error: 'Yêu cầu đăng nhập' })

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } })
    if (!playlist || playlist.userId !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa playlist này' })
    }

    await prisma.playlistSong.delete({
      where: {
        playlistId_songId: { playlistId, songId: Number(songId) },
      },
    })

    res.json({ message: 'Đã xóa bài hát khỏi playlist' })
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi xóa bài hát khỏi playlist' })
  }
}