import { Router } from 'express'
import { getJamendoCatalog } from '../controllers/catalog.controller'
import { cacheMiddleware } from '../middlewares/cache.middleware'

const router = Router()

router.get('/jamendo', cacheMiddleware({ ttlSeconds: 120, keyPrefix: 'catalog' }), getJamendoCatalog)

export default router