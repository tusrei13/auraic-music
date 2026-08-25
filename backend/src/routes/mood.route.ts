import { Router } from 'express'
import { listMoods, getMoodTracks } from '../controllers/mood.controller'

const router = Router()

router.get('/', listMoods)
router.get('/:moodId', getMoodTracks)

export default router
