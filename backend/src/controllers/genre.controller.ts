import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { sendInternalError } from '../lib/api-error'

export const getGenres = async (_req: Request, res: Response) => {
  try {
    const genres = await prisma.genre.findMany()
    res.json(genres)
  } catch (error) {
    sendInternalError(res, 'GENRE_LIST_ERROR', 'Không thể lấy danh sách thể loại')
  }
}

export const getMoods = async (_req: Request, res: Response) => {
  try {
    const moods = await prisma.mood.findMany()
    res.json(moods)
  } catch (error) {
    sendInternalError(res, 'MOOD_LIST_ERROR', 'Không thể lấy danh sách tâm trạng')
  }
}