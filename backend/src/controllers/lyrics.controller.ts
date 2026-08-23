import { Request, Response } from 'express'
import { sendError } from '../lib/api-error'
import { getLyrics } from '../services/lyrics.service'

export const getTrackLyrics = async (req: Request, res: Response) => {
  const trackName = typeof req.query.trackName === 'string' ? req.query.trackName : ''
  const artistName = typeof req.query.artistName === 'string' ? req.query.artistName : ''

  if (!trackName.trim() || !artistName.trim()) {
    return sendError(res, 400, 'INVALID_LYRICS_QUERY', 'Cần có tên bài hát và nghệ sĩ')
  }

  try {
    return res.json(await getLyrics(trackName, artistName))
  } catch {
    return sendError(res, 502, 'LYRICS_PROVIDER_ERROR', 'Không thể tải lyrics lúc này')
  }
}
