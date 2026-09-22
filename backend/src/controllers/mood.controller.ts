import { Request, Response } from 'express'
import { sendError } from '../lib/api-error'

const PLACEHOLDER_MOODS = [
  { id: 'happy', name: 'Vui vẻ', description: 'Nhạc vui tươi, tràn đầy năng lượng', color: '#fbbf24', icon: 'sun' },
  { id: 'sad', name: 'Buồn', description: 'Nhạc trầm lắng, sâu lắng', color: '#60a5fa', icon: 'cloud-rain' },
  { id: 'energetic', name: 'Năng lượng', description: 'Nhạc sôi động, tập trung', color: '#f87171', icon: 'zap' },
  { id: 'chill', name: 'Thư giãn', description: 'Nhạc nhẹ nhàng, thư giãn', color: '#34d399', icon: 'coffee' },
  { id: 'romantic', name: 'Lãng mạn', description: 'Nhạc ngọt ngào, lãng mạn', color: '#f472b6', icon: 'heart' },
  { id: 'focus', name: 'Tập trung', description: 'Nhạc giúp tập trung làm việc', color: '#a78bfa', icon: 'target' },
]

export const listMoods = (_req: Request, res: Response) => {
  return res.json({ data: PLACEHOLDER_MOODS })
}

export const getMoodTracks = async (_req: Request, res: Response) => {
  return sendError(res, 501, 'NOT_IMPLEMENTED', 'Tính năng lọc theo tâm trạng chưa được triển khai')
}
