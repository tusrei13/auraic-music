import { Router } from 'express'
import { getGenres, getMoods } from '../controllers/genre.controller'
import { cacheMiddleware } from '../middlewares/cache.middleware'

const router = Router()

router.get('/genres', cacheMiddleware({ ttlSeconds: 900, keyPrefix: 'genres' }), getGenres)
router.get('/moods', cacheMiddleware({ ttlSeconds: 900, keyPrefix: 'genre-moods' }), getMoods)

export default router