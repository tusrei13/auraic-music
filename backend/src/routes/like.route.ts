import { Router } from 'express'
import { toggleLike, getMyLikes } from '../controllers/like.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { likeToggleSchema, validate } from '../middlewares/validate.middleware'

const router = Router()

router.post('/toggle', authenticate, validate(likeToggleSchema), toggleLike)
router.get('/my-likes', authenticate, getMyLikes)

export default router
