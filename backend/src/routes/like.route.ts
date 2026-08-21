import { Router } from 'express'
import { toggleLike, getMyLikes } from '../controllers/like.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.post('/toggle', authenticate, toggleLike)
router.get('/my-likes', authenticate, getMyLikes)

export default router