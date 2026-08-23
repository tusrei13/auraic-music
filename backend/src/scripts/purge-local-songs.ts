import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  const songs = await prisma.song.findMany({ select: { id: true } })
  const songIds = songs.map((song) => song.id)

  const result = await prisma.$transaction(async (transaction) => {
    if (songIds.length > 0) {
      await transaction.listeningHistory.deleteMany({ where: { songId: { in: songIds } } })
      await transaction.like.deleteMany({ where: { songId: { in: songIds } } })
      await transaction.playlistSong.deleteMany({ where: { songId: { in: songIds } } })
    }
    const deletedSongs = songIds.length > 0
      ? await transaction.song.deleteMany({ where: { id: { in: songIds } } })
      : { count: 0 }
    await transaction.follow.deleteMany({})
    await transaction.album.deleteMany({})
    await transaction.artist.deleteMany({})
    await transaction.genre.deleteMany({})
    await transaction.mood.deleteMany({})
    return deletedSongs
  })

  console.log(`Đã xóa ${result.count} bài hát local và toàn bộ catalog nội bộ liên quan.`)
}

main()
  .catch((error) => {
    console.error('Không thể dọn bài hát local:', error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())