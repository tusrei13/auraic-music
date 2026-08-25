import { Router } from 'express'
import { getChart } from '../controllers/chart.controller'

const router = Router()

router.get('/', getChart)

export default router
