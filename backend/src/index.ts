import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import path from 'node:path'

import songRoutes from './routes/song.route'
import artistRoutes from './routes/artist.route'
import genreRoutes from './routes/genre.route'
import playlistRoutes from './routes/playlist.route'
import searchRoutes from './routes/search.route'
import authRoutes from './routes/auth.route'
import likeRoutes from './routes/like.route'
import catalogRoutes from './routes/catalog.route'
import lyricsRoutes from './routes/lyrics.route'
import adminRoutes from './routes/admin.route'
import analyticsRoutes from './routes/analytics.route'
import healthRoutes from './routes/health.route'
import moodRoutes from './routes/mood.route'
import recommendationRoutes from './routes/recommendation.route'
import chartRoutes from './routes/chart.route'
import userDataRoutes from './routes/user-data.route'

import { sendError } from './lib/api-error'
import { requestContext, rateLimit } from './middlewares/platform.middleware'
import { observabilityMiddleware } from './middlewares/observability.middleware'
import { setupGracefulShutdown } from './lib/shutdown'
import { logger } from './lib/logger'
import { setupTracing, shutdownTracing } from './lib/tracing'
import { setupOpenAPI } from './lib/openapi'

dotenv.config()

setupTracing()

const app = express()
const PORT = process.env.PORT || 5000
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3001')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false // Allow modern SPA & external media stream
  })
)

// CORS Configuration
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    exposedHeaders: [
      'x-next-cursor',
      'x-page-limit',
      'x-request-id',
      'x-ratelimit-limit',
      'x-ratelimit-remaining'
    ]
  })
)

app.use(express.json({ limit: '2mb' }))
app.use(requestContext)
app.use(observabilityMiddleware)

// Healthchecks & Metrics routes (no auth required)
app.use('/', healthRoutes)

// Legacy / Unversioned Routes
app.use('/api/auth', rateLimit(60_000, 30), authRoutes)
app.use('/api/songs', songRoutes)
app.use('/api/artists', artistRoutes)
app.use('/api/playlists', playlistRoutes)
app.use('/api/likes', likeRoutes)
app.use('/api/search', rateLimit(60_000, 60), searchRoutes)
app.use('/api/catalog', catalogRoutes)
app.use('/api/lyrics', lyricsRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/moods', moodRoutes)
app.use('/api/recommendations', recommendationRoutes)
app.use('/api/charts', chartRoutes)
app.use('/api/user', userDataRoutes)

// Versioned contract for modern clients (/api/v1)
app.use('/api/v1/auth', rateLimit(60_000, 30), authRoutes)
app.use('/api/v1/songs', songRoutes)
app.use('/api/v1/search', rateLimit(60_000, 60), searchRoutes)
app.use('/api/v1/catalog', rateLimit(60_000, 60), catalogRoutes)
app.use('/api/v1/playlists', playlistRoutes)
app.use('/api/v1/likes', likeRoutes)
app.use('/api/v1/lyrics', rateLimit(60_000, 60), lyricsRoutes)
app.use('/api/v1/analytics', analyticsRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/moods', moodRoutes)
app.use('/api/v1/recommendations', recommendationRoutes)
app.use('/api/v1/charts', chartRoutes)
app.use('/api/v1/user', userDataRoutes)
app.use('/api/v1', genreRoutes)
app.use('/api', genreRoutes)

// Static Media Hosting
app.use('/media', express.static(path.resolve(process.env.MEDIA_ROOT || path.join(process.cwd(), 'media'))))

// OpenAPI Documentation
setupOpenAPI(app)

app.use((_req, res) => {
  sendError(res, 404, 'ENDPOINT_NOT_FOUND', 'Không tìm thấy endpoint')
})

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const requestId = (req as express.Request & { context?: { requestId?: string } }).context?.requestId
  logger.error('Unhandled API error', { requestId }, { error: err })
  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Lỗi server không xác định')
})

const server = app.listen(PORT, () => {
  logger.info(`🚀 Auraic Backend server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
})

setupGracefulShutdown(server)

export default app
