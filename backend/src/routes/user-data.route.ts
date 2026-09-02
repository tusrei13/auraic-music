import { Router } from 'express'
import { exportUserData, deleteUserData } from '../controllers/user-data.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/export', authenticate, exportUserData)
router.delete('/data', authenticate, deleteUserData)

export default router
