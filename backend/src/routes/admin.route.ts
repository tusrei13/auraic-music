import { Router } from 'express'
import { getAdminOverview } from '../controllers/admin.controller'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'

const router = Router()

router.get('/overview', authenticate, requireAdmin, getAdminOverview)

export default router
