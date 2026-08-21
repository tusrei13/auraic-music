import { Router } from 'express'
import { register, login, getMe } from '../controllers/auth.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { loginSchema, registerSchema, validate } from '../middlewares/validate.middleware'

const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.get('/me', authenticate, getMe)

export default router