import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

export const getGenres = async (_req: Request, res: Response) => {
  try {
    const genres = await prisma.genre.findMany()
    res.json(genres)
  } catch (error) {
    res.status(500).json({ error: 'Không thể lấy danh sách thể loại' })
  }
}

export const getMoods = async (_req: Request, res: Response) => {
  try {
    const moods = await prisma.mood.findMany()
    res.json(moods)
  } catch (error) {
    res.status(500).json({ error: 'Không thể lấy danh sách tâm trạng' })
  }
}