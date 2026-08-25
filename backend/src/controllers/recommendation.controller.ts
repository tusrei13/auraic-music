import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { getPersonalizedRecommendations } from '../services/recommendation.service'
import { sendInternalError } from '../lib/api-error'

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20
  const userId = req.user?.id

  try {
    const result = await getPersonalizedRecommendations(userId, { limit })
    return res.json(result)
  } catch (error) {
    return sendInternalError(res, 'RECOMMENDATION_FAILED', 'Không thể tạo danh sách gợi ý âm nhạc')
  }
}
