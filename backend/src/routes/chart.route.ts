import { Router } from 'express'
import { getChart } from '../controllers/chart.controller'
import { cacheMiddleware } from '../middlewares/cache.middleware'

const router = Router()

router.get('/', cacheMiddleware({ ttlSeconds: 300, keyPrefix: 'chart' }), getChart)

export default router

