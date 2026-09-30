import { Router } from 'express'
import { getArtists, getArtistById } from '../controllers/artist.controller'
import { cacheMiddleware } from '../middlewares/cache.middleware'

const router = Router()

router.get('/', cacheMiddleware({ ttlSeconds: 600, keyPrefix: 'artists' }), getArtists)
router.get('/:id', cacheMiddleware({ ttlSeconds: 300, keyPrefix: 'artist-detail' }), getArtistById)

export default router