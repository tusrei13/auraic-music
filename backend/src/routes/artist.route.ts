import { Router } from 'express'
import { getArtists, getArtistById } from '../controllers/artist.controller'

const router = Router()

router.get('/', getArtists)
router.get('/:id', getArtistById)

export default router