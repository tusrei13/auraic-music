import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Đang dọn dẹp dữ liệu cũ...')
  // Xóa theo thứ tự phụ thuộc bảng (foreign key)
  await prisma.listeningHistory.deleteMany()
  await prisma.like.deleteMany()
  await prisma.playlistSong.deleteMany()
  await prisma.playlist.deleteMany()
  await prisma.song.deleteMany()
  await prisma.mood.deleteMany()
  await prisma.genre.deleteMany()
  await prisma.artist.deleteMany()
  await prisma.user.deleteMany()

  console.log('🎵 Đang khởi tạo dữ liệu mẫu...')

  // 1. Tạo User mẫu
  const user1 = await prisma.user.create({
    data: {
      email: 'demo@auraic.com',
      name: 'Auraic Listener',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    },
  })

  // 2. Tạo Ca sĩ / Nghệ sĩ (Artist)
  const artist1 = await prisma.artist.create({
    data: {
      name: 'Sơn Tùng M-TP',
      avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
      listeners: 1500000,
    },
  })

  const artist2 = await prisma.artist.create({
    data: {
      name: 'Đen Vâu',
      avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300',
      listeners: 1200000,
    },
  })

  // 3. Tạo Thể loại nhạc (Genre)
  const genrePop = await prisma.genre.create({
    data: {
      name: 'Pop',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
      color: '#ec4899',
    },
  })

  const genreHipHop = await prisma.genre.create({
    data: {
      name: 'Hip Hop / Rap',
      image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300',
      color: '#8b5cf6',
    },
  })

  // 4. Tạo Tâm trạng (Mood)
  await prisma.mood.createMany({
    data: [
      { title: 'Thư giãn', color: 'from-blue-500 to-indigo-500', icon: 'coffee' },
      { title: 'Tập trung', color: 'from-emerald-500 to-teal-500', icon: 'brain' },
      { title: 'Sôi động', color: 'from-orange-500 to-red-500', icon: 'zap' },
      { title: 'Buồn / Chill', color: 'from-purple-500 to-pink-500', icon: 'moon' },
    ],
  })

  // 5. Tạo Bài hát (Song)
  const song1 = await prisma.song.create({
    data: {
      title: 'Chúng Ta Của Tương Lai',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300',
      playCount: 50000,
      artistId: artist1.id,
      genreId: genrePop.id,
      lyrics: [
        { time: 0, text: 'Chúng ta của tương lai...' },
        { time: 10, text: 'Dù có ra sao sau này...' },
      ],
    },
  })

  const song2 = await prisma.song.create({
    data: {
      title: 'Nấu Ăn Cho Em',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300',
      playCount: 80000,
      artistId: artist2.id,
      genreId: genreHipHop.id,
    },
  })

  // 6. Tạo Danh sách phát (Playlist) & Thêm bài hát vào Playlist
  await prisma.playlist.create({
    data: {
      name: 'Nhạc Việt Chill Mỗi Ngày',
      coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300',
      userId: user1.id,
      songs: {
        create: [
          { songId: song1.id },
          { songId: song2.id },
        ],
      },
    },
  })

  // 7. Tạo Lượt thích (Like) & Lịch sử nghe (ListeningHistory)
  await prisma.like.create({
    data: {
      userId: user1.id,
      songId: song1.id,
    },
  })

  await prisma.listeningHistory.create({
    data: {
      userId: user1.id,
      songId: song1.id,
    },
  })

  console.log('🎉 Chèn dữ liệu mẫu thành công!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })