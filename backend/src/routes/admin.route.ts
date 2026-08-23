import { Router } from 'express'
import { getAdminOverview, getAdminPlaylists, getAdminSongs, getAdminUsers } from '../controllers/admin.controller'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'

const router = Router()

router.get('/overview', authenticate, requireAdmin, getAdminOverview)
router.get('/users', authenticate, requireAdmin, getAdminUsers)
router.get('/songs', authenticate, requireAdmin, getAdminSongs)
router.get('/playlists', authenticate, requireAdmin, getAdminPlaylists)

export default router
