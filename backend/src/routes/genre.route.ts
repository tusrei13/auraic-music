import { Router } from 'express'
import { getGenres, getMoods } from '../controllers/genre.controller'

const router = Router()

router.get('/genres', getGenres)
router.get('/moods', getMoods)

export default router