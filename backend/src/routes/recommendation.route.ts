import { Router } from 'express'
import { getRecommendations } from '../controllers/recommendation.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

// Support both authenticated (personalized) and guest/anonymous requests
router.get('/personalized', authenticate, getRecommendations)
router.get('/', authenticate, getRecommendations)

export default router
