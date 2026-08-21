import { Router } from 'express'
import { getSongs } from '../controllers/song.controller'

const router = Router()

router.get('/', getSongs)

export default router