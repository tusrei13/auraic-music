import { Router } from 'express'
import { getListeningHistory, getSongs, recordListening } from '../controllers/song.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', getSongs)
router.get('/history', authenticate, getListeningHistory)
router.post('/:id/listen', authenticate, recordListening)

export default router