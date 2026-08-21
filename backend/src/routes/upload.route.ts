import { Router } from 'express'
import multer from 'multer'
import os from 'node:os'
import { authenticate } from '../middlewares/auth.middleware'
import { uploadSong } from '../controllers/upload.controller'

const router = Router()
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith('audio/'))
  },
})

router.post('/songs', authenticate, upload.single('audio'), uploadSong)

export default router
