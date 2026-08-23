import { Router } from 'express'
import {
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  reorderPlaylistSongs,
  deletePlaylist,
} from '../controllers/playlist.controller'
import { authenticate } from '../middlewares/auth.middleware'
import { createPlaylistSchema, playlistIdParamsSchema, playlistReorderSchema, playlistSongParamsSchema, playlistSongSchema, validate } from '../middlewares/validate.middleware'

const router = Router()

router.get('/', getPlaylists)
router.get('/:id', validate(playlistIdParamsSchema), getPlaylistById)
router.post('/', authenticate, validate(createPlaylistSchema), createPlaylist)
router.post('/:id/songs', authenticate, validate(playlistSongSchema), addSongToPlaylist)
router.put('/:id/reorder', authenticate, validate(playlistReorderSchema), reorderPlaylistSongs)
router.delete('/:id/songs/:songId', authenticate, validate(playlistSongParamsSchema), removeSongFromPlaylist)
router.delete('/:id', authenticate, validate(playlistIdParamsSchema), deletePlaylist)

export default router