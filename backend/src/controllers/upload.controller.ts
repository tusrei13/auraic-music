import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { sendError, sendInternalError } from '../lib/api-error'
import { getFfmpegPath, transcodeToHls } from '../services/transcoding.service'
import { publishMediaDirectory } from '../services/media-storage.service'
import fs from 'node:fs/promises'
import { AuthRequest } from '../middlewares/auth.middleware'

export const uploadSong = async (req: AuthRequest, res: Response) => {
  const file = req.file
  const { title, artistId, image, genreId, albumId, moodId } = req.body

  if (!file) return sendError(res, 400, 'AUDIO_FILE_REQUIRED', 'Cần tải lên một file audio')
  if (typeof title !== 'string' || !title.trim()) {
    return sendError(res, 400, 'INVALID_SONG_TITLE', 'Tên bài hát là bắt buộc')
  }
  if (typeof artistId !== 'string' || !artistId.trim()) {
    return sendError(res, 400, 'INVALID_ARTIST_ID', 'artistId là bắt buộc')
  }

  try {
    const artist = await prisma.artist.findUnique({ where: { id: artistId } })
    if (!artist) return sendError(res, 404, 'ARTIST_NOT_FOUND', 'Không tìm thấy nghệ sĩ')

    const result = await transcodeToHls(file.path)
    const publishedUrl = await publishMediaDirectory(result.mediaDirectory, result.mediaId)
    const mediaUrl = publishedUrl || result.masterPlaylist
    const song = await prisma.song.create({
      data: {
        title: title.trim(),
        audioUrl: mediaUrl,
        hlsUrl: mediaUrl,
        duration: result.duration,
        image: typeof image === 'string' ? image : artist.avatar,
        artistId,
        genreId: typeof genreId === 'string' && genreId ? genreId : undefined,
        albumId: typeof albumId === 'string' && albumId ? albumId : undefined,
        moodId: typeof moodId === 'string' && moodId ? moodId : undefined,
      },
      include: { artist: true, genre: true, album: true, mood: true },
    })

    if (publishedUrl) await fs.rm(result.mediaDirectory, { recursive: true, force: true })

    res.status(201).json(song)
  } catch (error) {
    console.error('Song upload/transcoding failed:', error)
    const message = error instanceof Error && /ffmpeg|spawn|ENOENT|executable/i.test(error.message)
      ? `Không thể chạy FFmpeg (${getFfmpegPath()}). Hãy cài FFmpeg Windows đầy đủ hoặc cấu hình FFMPEG_PATH.`
      : 'Không thể xử lý file audio'
    sendError(res, 500, 'SONG_UPLOAD_ERROR', message)
  }
}
