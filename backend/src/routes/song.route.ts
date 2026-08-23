import { Router } from 'express'
import { getListeningHistory, getSongs, recordJamendoListening, recordListening } from '../controllers/song.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { jamendoListeningSchema, songIdParamsSchema, validate } from '../middlewares/validate.middleware'

const router = Router()

router.get('/', getSongs)
router.get('/history', authenticate, getListeningHistory)
router.post('/jamendo-listen', authenticate, validate(jamendoListeningSchema), recordJamendoListening)
router.post('/:id/listen', authenticate, validate(songIdParamsSchema), recordListening)

export default router