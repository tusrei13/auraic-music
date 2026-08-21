import { Router } from 'express'
import { toggleLike, getMyLikes } from '../controllers/like.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { songIdBodySchema, validate } from '../middlewares/validate.middleware'

const router = Router()

router.post('/toggle', authenticate, validate(songIdBodySchema), toggleLike)
router.get('/my-likes', authenticate, getMyLikes)

export default router