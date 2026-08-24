import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

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
import { sendError } from './lib/api-error'
import path from 'node:path'
import { requestContext, rateLimit } from './middlewares/platform.middleware'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3001')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())
app.use(requestContext)

// Routes
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

// Versioned contract for new clients; legacy /api routes remain backwards compatible.
app.use('/api/v1/auth', rateLimit(60_000, 30), authRoutes)
app.use('/api/v1/songs', songRoutes)
app.use('/api/v1/search', rateLimit(60_000, 60), searchRoutes)
app.use('/api/v1/catalog', rateLimit(60_000, 60), catalogRoutes)
app.use('/api/v1/playlists', playlistRoutes)
app.use('/api/v1/likes', likeRoutes)
app.use('/api/v1/lyrics', rateLimit(60_000, 60), lyricsRoutes)
app.use('/api/v1/analytics', analyticsRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1', genreRoutes)
app.use('/api', genreRoutes)
app.use('/media', express.static(path.resolve(process.env.MEDIA_ROOT || path.join(process.cwd(), 'media'))))

app.get('/', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Auraic API Dashboard</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; max-width: 950px; margin: 0 auto; }
        h1 { color: #38bdf8; margin-bottom: 0.5rem; }
        p { color: #94a3b8; margin-bottom: 1.5rem; }
        table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); }
        th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; }
        th { background: #334155; color: #38bdf8; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.05em; }
        .method { font-weight: bold; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; }
        .get { background: #22c55e; color: #022c22; }
        .post { background: #3b82f6; color: #1e3a8a; }
        .delete { background: #ef4444; color: #450a0a; }
        a { color: #38bdf8; text-decoration: none; font-weight: 500; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>🎵 Auraic Backend API</h1>
      <p>Hệ thống Backend đang hoạt động bình thường. Dưới đây là danh sách các API Endpoints:</p>
      <table>
        <thead>
          <tr>
            <th>Method</th>
            <th>Endpoint</th>
            <th>Mô tả</th>
            <th>Thử nghiệm</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="method get">GET</span></td>
            <td><code>/api/songs</code></td>
            <td>Danh sách bài hát</td>
            <td><a href="/api/songs" target="_blank">Mở API ↗</a></td>
          </tr>
          <tr>
            <td><span class="method get">GET</span></td>
            <td><code>/api/artists</code></td>
            <td>Danh sách nghệ sĩ</td>
            <td><a href="/api/artists" target="_blank">Mở API ↗</a></td>
          </tr>
          <tr>
            <td><span class="method get">GET</span></td>
            <td><code>/api/genres</code></td>
            <td>Danh sách thể loại nhạc</td>
            <td><a href="/api/genres" target="_blank">Mở API ↗</a></td>
          </tr>
          <tr>
            <td><span class="method get">GET</span></td>
            <td><code>/api/playlists</code></td>
            <td>Danh sách playlist</td>
            <td><a href="/api/playlists" target="_blank">Mở API ↗</a></td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td><code>/api/playlists</code></td>
            <td>Tạo Playlist mới (Auth)</td>
            <td>JSON Body</td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td><code>/api/likes/toggle</code></td>
            <td>Thả tim / Bỏ thả tim bài hát (Auth)</td>
            <td>JSON Body</td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td><code>/api/auth/register</code></td>
            <td>Đăng ký tài khoản Supabase</td>
            <td>JSON Body</td>
          </tr>
          <tr>
            <td><span class="method post">POST</span></td>
            <td><code>/api/auth/login</code></td>
            <td>Đăng nhập Supabase</td>
            <td>JSON Body</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `)
})

app.use((_req, res) => {
  sendError(res, 404, 'ENDPOINT_NOT_FOUND', 'Không tìm thấy endpoint')
})

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled API error:', err)
  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Lỗi server không xác định')
})

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`)
})
