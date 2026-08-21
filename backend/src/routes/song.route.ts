import { Router } from 'express'
import { getListeningHistory, getSongs, recordListening } from '../controllers/song.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { songIdParamsSchema, validate } from '../middlewares/validate.middleware'

const router = Router()

router.get('/', getSongs)
router.get('/history', authenticate, getListeningHistory)
router.post('/:id/listen', authenticate, validate(songIdParamsSchema), recordListening)

export default router