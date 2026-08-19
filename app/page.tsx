"use client"; // Bắt buộc phải có để sử dụng các tính năng tương tác của React

import { Play } from "lucide-react";
import { useMusic } from "@/context/MusicContext"; // Import công cụ kết nối Trạm phát sóng

// MOCK DATA: Đã thêm các link MP3 bản quyền miễn phí (Royalty-free)
const mockAlbums = [
  { id: 1, title: "Midnight City", artist: "M83", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "Starboy", artist: "The Weeknd", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "Random Access Memories", artist: "Daft Punk", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: 4, title: "Currents", artist: "Tame Impala", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: 5, title: "After Hours", artist: "The Weeknd", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
];

export default function HomePage() {
  // Lấy hàm playTrack từ Trạm phát sóng
  const { playTrack } = useMusic();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8 tracking-tight">Chào buổi sáng</h1>

      <section>
        <h2 className="text-xl font-semibold text-white/90 mb-4">Tuyển tập cho bạn</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {mockAlbums.map((album) => (
            <div 
              key={album.id} 
              // GẮN SỰ KIỆN: Khi click vào Album, gửi toàn bộ thông tin album đó lên Trạm phát sóng
              onClick={() => playTrack(album)}
              className="group bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer border border-white/5 hover:border-white/10"
            >
              <div className="relative aspect-square w-full mb-4 overflow-hidden rounded-lg shadow-lg">
                <img src={album.image} alt={album.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105" />
                
                <div className="absolute bottom-2 right-2 bg-white text-black p-3 rounded-full opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl flex items-center justify-center">
                  <Play className="w-5 h-5 fill-black ml-1" />
                </div>
              </div>

              <h3 className="font-semibold text-white/90 truncate">{album.title}</h3>
              <p className="text-sm text-white/50 mt-1 truncate">{album.artist}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}