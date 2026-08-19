"use client";

import { useState } from "react";
import { Search, Play, Flame, Sparkles, Music } from "lucide-react";
import { useMusic } from "@/context/MusicContext";

const genres = ["Tất cả", "Indie Vietnam", "Lofi Chill", "Synthwave", "EDM Night", "Acoustic"];

// 1. MỚI: Thêm thuộc tính 'genre' cho mỗi bài hát và sửa link ảnh số 4
const trendingSongs = [
  { id: 101, title: "Nốt Nhạc Trôi", artist: "Chillies", genre: "Indie Vietnam", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
  { id: 102, title: "Dạ Vũ Không Tên", artist: "Hoàng Dũng", genre: "Indie Vietnam", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
  { id: 103, title: "Neon Skyline", artist: "Lofi Girl", genre: "Lofi Chill", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  { id: 104, title: "Midnight Memories", artist: "KDM", genre: "Synthwave", image: "https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
];

export default function DiscoverPage() {
  const { playTrack } = useMusic();
  const [selectedGenre, setSelectedGenre] = useState("Tất cả");
  
  // 2. MỚI: State lưu trữ từ khóa tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");

  // 3. MỚI: Logic lọc bài hát
  const filteredSongs = trendingSongs.filter((song) => {
    // Điều kiện 1: Khớp thể loại
    const matchGenre = selectedGenre === "Tất cả" || song.genre === selectedGenre;
    
    // Điều kiện 2: Khớp từ khóa tìm kiếm (chuyển hết về chữ thường để so sánh)
    const matchSearch = song.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        song.artist.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchGenre && matchSearch; // Phải thỏa mãn cả 2 điều kiện
  });

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto scrollbar-none pb-24">
      {/* THANH TÌM KIẾM */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} // Ghi nhận ký tự gõ vào
          placeholder="Tìm bài hát, nghệ sĩ, hoặc album..." 
          className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all shadow-inner"
        />
      </div>

      {/* BỘ LỌC THỂ LOẠI */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" /> Thể loại nổi bật
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                selectedGenre === genre
                  ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                  : "bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:text-white"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* DẢI BÀI HÁT TỪ DANH SÁCH ĐÃ LỌC (filteredSongs) */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" /> Xu hướng hôm nay
        </h2>
        
        <div className="space-y-2">
          {/* Nếu tìm không thấy bài nào thì báo lỗi */}
          {filteredSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-white/40 bg-white/5 rounded-2xl border border-dashed border-white/10">
              <Music className="w-12 h-12 mb-3 opacity-50" />
              <p>Không tìm thấy bài hát nào phù hợp.</p>
            </div>
          ) : (
            // Nếu có thì render ra danh sách
            filteredSongs.map((song, index) => (
              <div 
                key={song.id}
                onClick={() => playTrack(song)}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <span className="w-6 text-center text-sm font-bold text-white/30 group-hover:text-indigo-400 transition-colors">
                    {index + 1}
                  </span>
                  <img src={song.image} alt={song.title} className="w-12 h-12 rounded-xl object-cover shadow-md" />
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">{song.title}</h4>
                    <p className="text-xs text-white/50">{song.artist} • {song.genre}</p>
                  </div>
                </div>

                <button className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all shadow-md">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}