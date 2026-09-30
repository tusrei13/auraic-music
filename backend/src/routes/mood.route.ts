import { Router } from 'express'
import { listMoods, getMoodTracks } from '../controllers/mood.controller'
import { cacheMiddleware } from '../middlewares/cache.middleware'

const router = Router()

router.get('/', cacheMiddleware({ ttlSeconds: 600, keyPrefix: 'moods' }), listMoods)
router.get('/:moodId', cacheMiddleware({ ttlSeconds: 300, keyPrefix: 'mood-tracks' }), getMoodTracks)

export default router

