import { Router } from 'express'
import { recordAnalyticsEvent, getMyListeningInsights } from '../controllers/analytics.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.post('/events', authenticate, recordAnalyticsEvent)
router.get('/insights', authenticate, getMyListeningInsights)

export default router