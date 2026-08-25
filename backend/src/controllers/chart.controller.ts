import { Request, Response } from 'express'
import { getPublicChart } from '../services/chart.service'
import { sendInternalError } from '../lib/api-error'

export const getChart = async (req: Request, res: Response) => {
  const period = (req.query.period as 'daily' | 'weekly' | 'alltime') || 'weekly'
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20

  try {
    const chart = await getPublicChart(period, Math.min(Math.max(limit, 1), 50))
    return res.json(chart)
  } catch (error) {
    return sendInternalError(res, 'CHART_FETCH_FAILED', 'Không thể lấy bảng xếp hạng âm nhạc')
  }
}
