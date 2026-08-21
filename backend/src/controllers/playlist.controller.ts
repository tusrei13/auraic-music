import { Request, Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { isNonEmptyString, parsePositiveInteger } from '../lib/validation'
import { sendError, sendInternalError } from '../lib/api-error'

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
    sendInternalError(res, 'PLAYLIST_LIST_ERROR', 'Không thể lấy danh sách playlist')
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
    if (!playlist) return sendError(res, 404, 'PLAYLIST_NOT_FOUND', 'Không tìm thấy playlist')
    res.json(playlist)
  } catch (error) {
    sendInternalError(res, 'PLAYLIST_DETAIL_ERROR', 'Lỗi server')
  }
}

// Tạo Playlist mới
export const createPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { name, coverImage, color } = req.body

    if (!userId) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')
    if (!isNonEmptyString(name)) {
      return sendError(res, 400, 'INVALID_PLAYLIST_NAME', 'Tên playlist là bắt buộc')
    }

    const newPlaylist = await prisma.playlist.create({
      data: { name: name.trim(), coverImage, color, userId },
    })

    res.status(201).json(newPlaylist)
  } catch (error) {
    sendInternalError(res, 'PLAYLIST_CREATE_ERROR', 'Không thể tạo playlist')
  }
}

// Thêm bài hát vào Playlist
export const addSongToPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id: playlistId } = req.params
    const { songId } = req.body

    if (!userId) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')
    const numericSongId = parsePositiveInteger(songId)
    if (numericSongId === null) {
      return sendError(res, 400, 'INVALID_SONG_ID', 'songId không hợp lệ')
    }

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } })
    if (!playlist || playlist.userId !== userId) {
      return sendError(res, 403, 'PLAYLIST_FORBIDDEN', 'Bạn không có quyền chỉnh sửa playlist này')
    }

    const song = await prisma.song.findUnique({ where: { id: numericSongId } })
    if (!song) return sendError(res, 404, 'SONG_NOT_FOUND', 'Không tìm thấy bài hát')

    const playlistSong = await prisma.playlistSong.create({
      data: { playlistId, songId: numericSongId },
    })

    res.status(201).json(playlistSong)
  } catch (error) {
    sendInternalError(res, 'PLAYLIST_SONG_CREATE_ERROR', 'Không thể thêm bài hát vào playlist')
  }
}

// Xóa bài hát khỏi Playlist
export const removeSongFromPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id: playlistId, songId } = req.params

    if (!userId) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } })
    if (!playlist || playlist.userId !== userId) {
      return sendError(res, 403, 'PLAYLIST_FORBIDDEN', 'Bạn không có quyền chỉnh sửa playlist này')
    }

    await prisma.playlistSong.delete({
      where: {
        playlistId_songId: { playlistId, songId: Number(songId) },
      },
    })

    res.json({ message: 'Đã xóa bài hát khỏi playlist' })
  } catch (error) {
    sendInternalError(res, 'PLAYLIST_SONG_DELETE_ERROR', 'Lỗi khi xóa bài hát khỏi playlist')
  }
}

export const deletePlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id } = req.params
    if (!userId) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')

    const playlist = await prisma.playlist.findUnique({ where: { id } })
    if (!playlist) return sendError(res, 404, 'PLAYLIST_NOT_FOUND', 'Không tìm thấy playlist')
    if (playlist.userId !== userId) return sendError(res, 403, 'PLAYLIST_FORBIDDEN', 'Bạn không có quyền xóa playlist này')

    await prisma.playlist.delete({ where: { id } })
    res.json({ message: 'Đã xóa playlist' })
  } catch (error) {
    sendInternalError(res, 'PLAYLIST_DELETE_ERROR', 'Không thể xóa playlist')
  }
}