import { Router } from 'express'
import { deleteAdminPlaylist, getAdminAnalytics, getAdminOverview, getAdminPlaylists, getAdminUsers, updateAdminUserRole, getSystemSettings, updateSystemSettings, updateSongLyrics } from '../controllers/admin.controller'
import { authenticate, requireAdmin } from '../middlewares/auth.middleware'
import { adminSettingsSchema, adminUserRoleSchema, songLyricsSchema, validate } from '../middlewares/validate.middleware'

const router = Router()

router.get('/overview', authenticate, requireAdmin, getAdminOverview)
router.get('/analytics', authenticate, requireAdmin, getAdminAnalytics)
router.get('/users', authenticate, requireAdmin, getAdminUsers)
router.patch('/users/:id/role', authenticate, requireAdmin, validate(adminUserRoleSchema), updateAdminUserRole)
router.get('/playlists', authenticate, requireAdmin, getAdminPlaylists)
router.delete('/playlists/:id', authenticate, requireAdmin, deleteAdminPlaylist)
router.get('/settings', authenticate, requireAdmin, getSystemSettings)
router.put('/settings', authenticate, requireAdmin, validate(adminSettingsSchema), updateSystemSettings)
router.patch('/songs/:id/lyrics', authenticate, requireAdmin, validate(songLyricsSchema), updateSongLyrics)

export default router
