import { Request, Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { isNonEmptyString, parsePositiveInteger } from '../lib/validation'
import { sendError, sendInternalError } from '../lib/api-error'

export const getPlaylists = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')
    const playlists = await prisma.playlist.findMany({
      where: { userId: req.user.id },
      include: {
        user: { select: { name: true, avatar: true } },
        songs: { include: { song: { include: { artist: true } } } },
        jamendoSongs: true,
      },
    })
    res.json(playlists)
  } catch (error) {
    sendInternalError(res, 'PLAYLIST_LIST_ERROR', 'Không thể lấy danh sách playlist')
  }
}

export const getPlaylistById = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')
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
        jamendoSongs: true,
      },
    })
    if (!playlist) return sendError(res, 404, 'PLAYLIST_NOT_FOUND', 'Không tìm thấy playlist')
    if (playlist.userId !== req.user.id) return sendError(res, 403, 'PLAYLIST_FORBIDDEN', 'Bạn không có quyền xem playlist này')
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

// Thêm bài hát vào Playlist (Hỗ trợ cả Jamendo trackId và DB Song ID)
export const addSongToPlaylist = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id: playlistId } = req.params
    const { songId, trackId, title, artistName, image, audioUrl, duration } = req.body

    if (!userId) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } })
    if (!playlist || playlist.userId !== userId) {
      return sendError(res, 403, 'PLAYLIST_FORBIDDEN', 'Bạn không có quyền chỉnh sửa playlist này')
    }

    const rawId = String(trackId || songId || '')

    if (rawId.startsWith('jamendo:') || isNaN(Number(rawId))) {
      const actualTrackId = rawId.startsWith('jamendo:') ? rawId : `jamendo:${rawId}`
      const jamendoSong = await prisma.jamendoPlaylistSong.upsert({
        where: { playlistId_trackId: { playlistId, trackId: actualTrackId } },
        update: {
          title: title || 'Jamendo Track',
          artistName: artistName || 'Artist',
          image: image || '',
          audioUrl: audioUrl || '',
          duration: typeof duration === 'number' ? duration : null,
        },
        create: {
          playlistId,
          trackId: actualTrackId,
          title: title || 'Jamendo Track',
          artistName: artistName || 'Artist',
          image: image || '',
          audioUrl: audioUrl || '',
          duration: typeof duration === 'number' ? duration : null,
        },
      })

      if (!playlist.coverImage && jamendoSong.image) {
        await prisma.playlist.update({ where: { id: playlistId }, data: { coverImage: jamendoSong.image } })
      } else {
        await prisma.playlist.update({ where: { id: playlistId }, data: { updatedAt: new Date() } })
      }

      return res.status(201).json(jamendoSong)
    }

    const numericSongId = parsePositiveInteger(rawId)
    if (numericSongId === null) {
      return sendError(res, 400, 'INVALID_SONG_ID', 'songId không hợp lệ')
    }

    const song = await prisma.song.findUnique({ where: { id: numericSongId } })
    if (!song) return sendError(res, 404, 'SONG_NOT_FOUND', 'Không tìm thấy bài hát')

    const playlistSong = await prisma.playlistSong.create({
      data: { playlistId, songId: numericSongId },
    })

    if (!playlist.coverImage && song.image) {
      await prisma.playlist.update({ where: { id: playlistId }, data: { coverImage: song.image } })
    } else {
      await prisma.playlist.update({ where: { id: playlistId }, data: { updatedAt: new Date() } })
    }

    return res.status(201).json(playlistSong)
  } catch (error) {
    return sendInternalError(res, 'PLAYLIST_SONG_CREATE_ERROR', 'Không thể thêm bài hát vào playlist')
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

    const rawId = String(songId)
    if (rawId.startsWith('jamendo:') || isNaN(Number(rawId))) {
      const actualTrackId = rawId.startsWith('jamendo:') ? rawId : `jamendo:${rawId}`
      await prisma.jamendoPlaylistSong.deleteMany({
        where: { playlistId, trackId: actualTrackId },
      })
    } else {
      await prisma.playlistSong.deleteMany({
        where: { playlistId, songId: Number(rawId) },
      })
    }

    if (!playlist.coverImage) {
      const [firstDbSong, firstJamendo] = await Promise.all([
        prisma.playlistSong.findFirst({ where: { playlistId }, include: { song: true }, orderBy: { addedAt: 'asc' } }),
        prisma.jamendoPlaylistSong.findFirst({ where: { playlistId }, orderBy: { addedAt: 'asc' } }),
      ])

      let coverImage: string | null = null
      if (firstDbSong?.song?.image) {
        coverImage = firstDbSong.song.image
      } else if (firstJamendo?.image) {
        coverImage = firstJamendo.image
      }

      await prisma.playlist.update({ where: { id: playlistId }, data: { coverImage, updatedAt: new Date() } })
    } else {
      await prisma.playlist.update({ where: { id: playlistId }, data: { updatedAt: new Date() } })
    }

    return res.json({ message: 'Đã xóa bài hát khỏi playlist' })
  } catch (error) {
    return sendInternalError(res, 'PLAYLIST_SONG_DELETE_ERROR', 'Lỗi khi xóa bài hát khỏi playlist')
  }
}

export const reorderPlaylistSongs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { id: playlistId } = req.params
    const { trackIds } = req.body as { trackIds: Array<string | number> }

    if (!userId) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')
    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } })
    if (!playlist || playlist.userId !== userId) {
      return sendError(res, 403, 'PLAYLIST_FORBIDDEN', 'Bạn không có quyền chỉnh sửa playlist này')
    }

    await prisma.$transaction(async (transaction) => {
      for (const [index, rawTrackId] of trackIds.entries()) {
        const trackId = String(rawTrackId)
        const addedAt = new Date(Date.now() + index)
        if (trackId.startsWith('jamendo:') || Number.isNaN(Number(trackId))) {
          await transaction.jamendoPlaylistSong.updateMany({ where: { playlistId, trackId }, data: { addedAt } })
        } else {
          const numericSongId = parsePositiveInteger(trackId)
          if (numericSongId !== null) {
            await transaction.playlistSong.updateMany({ where: { playlistId, songId: numericSongId }, data: { addedAt } })
          }
        }
      }
      await transaction.playlist.update({ where: { id: playlistId }, data: { updatedAt: new Date() } })
    })

    return res.json({ message: 'Đã cập nhật thứ tự playlist' })
  } catch {
    return sendInternalError(res, 'PLAYLIST_REORDER_ERROR', 'Không thể cập nhật thứ tự playlist')
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
    return res.json({ message: 'Đã xóa playlist' })
  } catch (error) {
    return sendInternalError(res, 'PLAYLIST_DELETE_ERROR', 'Không thể xóa playlist')
  }
}