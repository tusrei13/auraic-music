import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Xóa dữ liệu cũ...");
  await prisma.listeningHistory.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.playlistSong.deleteMany({});
  await prisma.song.deleteMany({});
  await prisma.playlist.deleteMany({});
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

  console.log("Tạo Thể loại...");
  const vpop = await prisma.genre.create({
    data: {
      name: "V-Pop",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop",
    },
  });

  const hiphop = await prisma.genre.create({
    data: {
      name: "Rap / Hip-Hop",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=500&auto=format&fit=crop",
    },
  });

  console.log("Tạo Nghệ sĩ...");
  const sonTung = await prisma.artist.create({
    data: {
      name: "Sơn Tùng M-TP",
      avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop",
      listeners: 1500000,
    },
  });

  const denVau = await prisma.artist.create({
    data: {
      name: "Đen Vâu",
      avatar: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=500&auto=format&fit=crop",
      listeners: 1200000,
    },
  });

  const phuongMyChi = await prisma.artist.create({
    data: {
      name: "Phương Mỹ Chi",
      avatar: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop",
      listeners: 800000,
    },
  });

  console.log("Tạo Bài hát...");
  await prisma.song.createMany({
    data: [
      {
        title: "Chúng Ta Của Tương Lai",
        artistId: sonTung.id,
        genreId: vpop.id,
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      },
      {
        title: "Making My Way",
        artistId: sonTung.id,
        genreId: vpop.id,
        image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      },
      {
        title: "Nấu Ăn Cho Em",
        artistId: denVau.id,
        genreId: hiphop.id,
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=500&auto=format&fit=crop",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      },
      {
        title: "Trốn Tìm",
        artistId: denVau.id,
        genreId: hiphop.id,
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=500&auto=format&fit=crop",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      },
      {
        title: "Vũ Trụ Cò Bay",
        artistId: phuongMyChi.id,
        genreId: vpop.id,
        image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
      },
    ],
  });

  console.log("Tạo Playlist mẫu...");
  await prisma.playlist.create({
    data: {
      name: "Top 50 Việt Nam",
      coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop",
      userId: user.id,
    },
  });

  console.log("Đã nạp dữ liệu mẫu thành công!");
}

main()
  .catch((e) => {
    console.error("Lỗi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });