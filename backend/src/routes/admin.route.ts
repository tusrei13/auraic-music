import { Router } from 'express'
import { getAdminOverview, getAdminUsers } from '../controllers/admin.controller'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'

const router = Router()

router.get('/overview', authenticate, requireAdmin, getAdminOverview)
router.get('/users', authenticate, requireAdmin, getAdminUsers)

export default router
