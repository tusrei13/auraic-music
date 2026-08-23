import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Xóa dữ liệu cũ...");
  await prisma.listeningHistory.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.playlistSong.deleteMany({});
  await prisma.song.deleteMany({});
  await prisma.playlist.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.album.deleteMany({});
  await prisma.mood.deleteMany({});
  await prisma.artist.deleteMany({});
  await prisma.genre.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Tạo User mẫu...");
  const user = await prisma.user.create({
    data: {
      email: "demo@auraic.com",
      name: "Auraic Listener",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=500&auto=format&fit=crop",
    },
  });

  console.log("Bỏ qua catalog mẫu: nội dung được lấy trực tiếp từ Jamendo.");
  console.log("Đã nạp dữ liệu tài khoản mẫu thành công!");
}

main()
  .catch((e) => {
    console.error("Lỗi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });