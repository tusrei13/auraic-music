import { Response } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { sendError } from '../lib/api-error'

export const getRecommendations = async (_req: AuthRequest, res: Response) => {
  return sendError(res, 501, 'NOT_IMPLEMENTED', 'Tính năng gợi ý cá nhân hóa chưa được triển khai')
}
