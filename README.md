# Auraic

Ứng dụng nghe nhạc gồm frontend Next.js và backend Express/Prisma.

## Cấu trúc

- `frontend`: Next.js App Router, React, Zustand. `usePlayerStore` là nguồn trạng thái duy nhất cho trình phát.
- `backend`: Express API, Supabase Auth và Prisma/PostgreSQL.
- `backend/prisma/schema.prisma`: mô hình dữ liệu và quan hệ.

## Chạy local

### Backend

Tạo `backend/.env`:

```env
DATABASE_URL=...
DIRECT_URL=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
PORT=5000
```

`SUPABASE_URL` và `SUPABASE_ANON_KEY` lấy trong Supabase Dashboard tại
`Project Settings > API`. Không commit file `.env`; có thể dùng
`backend/.env.example` làm mẫu. Sau khi cập nhật biến môi trường, hãy khởi động
lại backend để Supabase client được tạo lại.

```bash
cd backend
npm install
npm run prisma:generate
npm run dev
```

### Frontend

Tạo `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
cd frontend
npm install
npm run dev
```

Mở `http://localhost:3000`.

## API chính

- `GET /api/songs`, `/api/artists`, `/api/genres`
- `GET /api/search?q=...`
- `GET /api/likes/my-likes` (yêu cầu Bearer token)
- `POST /api/likes/toggle` với body `{ "songId": 1 }`
- `GET/POST /api/playlists` và các route thêm/xóa bài hát

Frontend gửi token từ `localStorage.token` dưới dạng `Authorization: Bearer <token>`.
