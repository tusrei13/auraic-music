import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { prisma } from '../lib/prisma'
import { sendError, sendInternalError } from '../lib/api-error'

export const recordAnalyticsEvent = async (req: AuthRequest, res: Response) => {
  if (!req.user) return sendError(res, 401, 'UNAUTHENTICATED', 'Yêu cầu đăng nhập')

  try {
    const { eventType, trackId, source, title, position, duration } = req.body
    const event = await prisma.analyticsEvent.create({
      data: { userId: req.user.id, eventType, trackId, source: source || 'unknown', title, position, duration },
    })
    return res.status(201).json({ id: event.id, eventType: event.eventType, occurredAt: event.occurredAt })
  } catch {
    return sendInternalError(res, 'ANALYTICS_EVENT_ERROR', 'Không thể ghi nhận sự kiện nghe nhạc')
  }
}