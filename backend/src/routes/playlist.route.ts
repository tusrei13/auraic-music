import { Router } from 'express'
import {
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
} from '../controllers/playlist.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', getPlaylists)
router.get('/:id', getPlaylistById)
router.post('/', authenticate, createPlaylist)
router.post('/:id/songs', authenticate, addSongToPlaylist)
router.delete('/:id/songs/:songId', authenticate, removeSongFromPlaylist)

export default router