import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { sendError, sendInternalError } from '../lib/api-error'
import { processListeningEventsBatch, getUserListeningInsights, IngestionEventInput } from '../services/event-pipeline.service'

export const recordAnalyticsEvent = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')

  try {
    const rawEvents: IngestionEventInput[] = Array.isArray(req.body.events)
      ? req.body.events
      : [req.body]

    const result = await processListeningEventsBatch(req.user.id, rawEvents)

    return res.status(201).json({
      status: 'success',
      accepted: result.accepted,
      rejected: result.rejected,
      duplicate: result.duplicate,
      errors: result.errors
    })
  } catch (error) {
    return sendInternalError(res, 'ANALYTICS_EVENT_ERROR', 'Không thể ghi nhận sự kiện nghe nhạc')
  }
}

export const getMyListeningInsights = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')

  try {
    const days = req.query.days ? parseInt(String(req.query.days), 10) : 14
    const insights = await getUserListeningInsights(req.user.id, Math.min(Math.max(days, 1), 90))
    return res.json(insights)
  } catch (error) {
    return sendInternalError(res, 'ANALYTICS_INSIGHTS_ERROR', 'Không thể lấy dữ liệu phân tích nghe nhạc')
  }
}