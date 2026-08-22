import { Request, Response } from 'express'
import { sendError } from '../lib/api-error'
import { getJamendoTracks } from '../services/jamendo.service'

export const getJamendoCatalog = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit)
    const offset = Number(req.query.offset)
    const tracks = await getJamendoTracks({
      limit: Number.isFinite(limit) ? limit : undefined,
      offset: Number.isFinite(offset) ? offset : undefined,
      tags: typeof req.query.tags === 'string' ? req.query.tags : undefined,
    })
    res.json(tracks)
  } catch (error) {
    const message = error instanceof Error && error.message === 'Jamendo is not configured'
      ? 'Jamendo chưa được cấu hình'
      : 'Không thể tải catalog Jamendo'
    sendError(res, 503, 'JAMENDO_CATALOG_ERROR', message)
  }
}