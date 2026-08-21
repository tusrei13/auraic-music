import { Router } from 'express'
import { searchAll } from '../controllers/search.controller'

const router = Router()

router.get('/', searchAll)

export default router