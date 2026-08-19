"use client";

import { useState } from "react";
import { Search, Play, Flame, Sparkles } from "lucide-react";
import { useMusic } from "@/context/MusicContext";

const genres = ["Tất cả", "Indie Vietnam", "Lofi Chill", "Synthwave", "EDM Night", "Acoustic"];

const trendingSongs = [
  { id: 101, title: "Nốt Nhạc Trôi", artist: "Chillies", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
  { id: 102, title: "Dạ Vũ Không Tên", artist: "Hoàng Dũng", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
  { id: 103, title: "Neon Skyline", artist: "Lofi Girl", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  { id: 104, title: "Midnight Memories", artist: "KDM", image: "https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
];

export default function DiscoverPage() {
  const { playTrack } = useMusic();
  const [selectedGenre, setSelectedGenre] = useState("Tất cả");

  return (
    <div className="p-8 space-y-8">
      {/* THANH TÌM KIẾM GLASSMORPHISM */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input 
          type="text" 
          placeholder="Tìm bài hát, nghệ sĩ, hoặc album..." 
          className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all shadow-inner"
        />
      </div>

      {/* BỘ LỌC THỂ LOẠI (CHIPS) */}
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

      {/* DẢI BÀI HÁT TRENDING (LIST VIEW) */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" /> Xu hướng hôm nay
        </h2>
        <div className="space-y-2">
          {trendingSongs.map((song, index) => (
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
                  <p className="text-xs text-white/50">{song.artist}</p>
                </div>
              </div>

              <button className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all shadow-md">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}