import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import songRoutes from './routes/song.route'
import artistRoutes from './routes/artist.route'
import genreRoutes from './routes/genre.route'
import playlistRoutes from './routes/playlist.route'
import searchRoutes from './routes/search.route'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/songs', songRoutes)
app.use('/api/artists', artistRoutes)
app.use('/api/playlists', playlistRoutes)
app.use('/api/search', searchRoutes)
app.use('/api', genreRoutes)

app.get('/', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Auraic API Dashboard</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; max-width: 900px; margin: 0 auto; }
        h1 { color: #38bdf8; margin-bottom: 0.5rem; }
        p { color: #94a3b8; margin-bottom: 1.5rem; }
        table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); }
        th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; }
        th { background: #334155; color: #38bdf8; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.05em; }
        .method { background: #22c55e; color: #022c22; font-weight: bold; padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; }
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
            <td><span class="method">GET</span></td>
            <td><code>/api/songs</code></td>
            <td>Danh sách bài hát</td>
            <td><a href="/api/songs" target="_blank">Mở API ↗</a></td>
          </tr>
          <tr>
            <td><span class="method">GET</span></td>
            <td><code>/api/artists</code></td>
            <td>Danh sách nghệ sĩ</td>
            <td><a href="/api/artists" target="_blank">Mở API ↗</a></td>
          </tr>
          <tr>
            <td><span class="method">GET</span></td>
            <td><code>/api/genres</code></td>
            <td>Danh sách thể loại nhạc</td>
            <td><a href="/api/genres" target="_blank">Mở API ↗</a></td>
          </tr>
          <tr>
            <td><span class="method">GET</span></td>
            <td><code>/api/moods</code></td>
            <td>Danh sách tâm trạng</td>
            <td><a href="/api/moods" target="_blank">Mở API ↗</a></td>
          </tr>
          <tr>
            <td><span class="method">GET</span></td>
            <td><code>/api/playlists</code></td>
            <td>Danh sách playlist</td>
            <td><a href="/api/playlists" target="_blank">Mở API ↗</a></td>
          </tr>
          <tr>
            <td><span class="method">GET</span></td>
            <td><code>/api/search?q=sơn</code></td>
            <td>Tìm kiếm (Bài hát, nghệ sĩ, playlist)</td>
            <td><a href="/api/search?q=sơn" target="_blank">Mở API ↗</a></td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `)
})

app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`)
})