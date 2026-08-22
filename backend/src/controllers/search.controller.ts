import { Request, Response } from 'express'
import { sendInternalError } from '../lib/api-error'
import { getJamendoTracks } from '../services/jamendo.service'

export const searchAll = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || ''
    if (!q.trim()) {
      return res.json({ songs: [], artists: [], playlists: [] })
    }

    const songs = await getJamendoTracks({ limit: 50, tags: q })
    res.json({ songs, artists: [], playlists: [] })
  } catch (error) {
    sendInternalError(res, 'SEARCH_ERROR', 'Lỗi khi tìm kiếm')
  }
}