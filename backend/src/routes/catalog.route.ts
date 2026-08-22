import { Router } from 'express'
import { getJamendoCatalog } from '../controllers/catalog.controller'

const router = Router()

router.get('/jamendo', getJamendoCatalog)

export default router