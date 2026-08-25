import { Request, Response } from 'express'
import { getAllMoods, getTracksForMood } from '../services/mood-mix.service'
import { sendError, sendInternalError } from '../lib/api-error'

export const listMoods = (_req: Request, res: Response) => {
  const moods = getAllMoods()
  return res.json({ data: moods })
}

export const getMoodTracks = async (req: Request, res: Response) => {
  const { moodId } = req.params
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 24
  const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0

  try {
    const result = await getTracksForMood(moodId, { limit, offset })
    return res.json(result)
  } catch (error) {
    if (error instanceof Error && error.message.includes('not recognized')) {
      return sendError(res, 404, 'MOOD_NOT_FOUND', `Không tìm thấy thể loại tâm trạng: ${moodId}`)
    }
    return sendInternalError(res, 'MOOD_FETCH_FAILED', 'Không thể tải danh sách bài hát theo tâm trạng')
  }
}
