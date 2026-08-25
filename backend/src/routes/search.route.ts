import { Router } from 'express'
import { searchAll } from '../controllers/search.controller'
import { handleSemanticSearch } from '../controllers/semantic-search.controller'

const router = Router()

router.get('/semantic', handleSemanticSearch)
router.get('/', searchAll)

export default router