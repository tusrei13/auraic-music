import { Router } from 'express'
import { recordAnalyticsEvent } from '../controllers/analytics.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { analyticsEventSchema, validate } from '../middlewares/validate.middleware'

const router = Router()

router.post('/events', authenticate, validate(analyticsEventSchema), recordAnalyticsEvent)

export default router