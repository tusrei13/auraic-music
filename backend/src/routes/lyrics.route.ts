import { Router } from 'express'
import { getTrackLyrics } from '../controllers/lyrics.controller'

const router = Router()

router.get('/', getTrackLyrics)

export default router
