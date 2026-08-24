import { Router } from 'express'
import { deleteAdminPlaylist, getAdminAnalytics, getAdminArtists, getAdminOverview, getAdminPlaylists, getAdminSongs, getAdminTopJamendo, getAdminUsers, updateAdminUserRole, getIngestionStatus, runIngestion, getSystemSettings, updateSystemSettings } from '../controllers/admin.controller'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'
import { adminSettingsSchema, adminUserRoleSchema, validate } from '../middlewares/validate.middleware'

const router = Router()

router.get('/overview', authenticate, requireAdmin, getAdminOverview)
router.get('/analytics', authenticate, requireAdmin, getAdminAnalytics)
router.get('/users', authenticate, requireAdmin, getAdminUsers)
router.patch('/users/:id/role', authenticate, requireAdmin, validate(adminUserRoleSchema), updateAdminUserRole)
router.get('/songs', authenticate, requireAdmin, getAdminSongs)
router.get('/playlists', authenticate, requireAdmin, getAdminPlaylists)
router.delete('/playlists/:id', authenticate, requireAdmin, deleteAdminPlaylist)
router.get('/top-jamendo', authenticate, requireAdmin, getAdminTopJamendo)
router.get('/artists', authenticate, requireAdmin, getAdminArtists)
router.get('/ingestion/status', authenticate, requireAdmin, getIngestionStatus)
router.post('/ingestion/run', authenticate, requireAdmin, runIngestion)
router.get('/settings', authenticate, requireAdmin, getSystemSettings)
router.put('/settings', authenticate, requireAdmin, validate(adminSettingsSchema), updateSystemSettings)

export default router
