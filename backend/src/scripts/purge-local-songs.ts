import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
  const songs = await prisma.song.findMany({ select: { id: true } })
  const songIds = songs.map((song) => song.id)

  if (songIds.length === 0) {
    console.log('Không có bài hát local nào trong database.')
    return
  }

  const result = await prisma.$transaction(async (transaction) => {
    await transaction.listeningHistory.deleteMany({ where: { songId: { in: songIds } } })
    await transaction.like.deleteMany({ where: { songId: { in: songIds } } })
    await transaction.playlistSong.deleteMany({ where: { songId: { in: songIds } } })
    return transaction.song.deleteMany({ where: { id: { in: songIds } } })
  })

  console.log(`Đã xóa ${result.count} bài hát local và các quan hệ liên quan.`)
}

main()
  .catch((error) => {
    console.error('Không thể dọn bài hát local:', error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())