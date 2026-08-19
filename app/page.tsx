"use client";

import { Play, Sparkles, Flame, Headphones, ArrowRight } from "lucide-react";
import { useMusic } from "@/context/MusicContext";

const topPicks = [
  { id: 1, title: "Chạy Ngay Đi", artist: "Sơn Tùng M-TP", genre: "R&B / V-Pop", image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", duration: "4:05" },
  { id: 2, title: "Waiting For You", artist: "MONO", genre: "City Pop", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", duration: "3:25" },
  { id: 3, title: "Chìm Sâu", artist: "RPT MCK", genre: "Rap / Hip-Hop", image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", duration: "2:50" },
  { id: 4, title: "See Tình", artist: "Hoàng Thùy Linh", genre: "Dance Pop", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", duration: "3:10" },
];

export default function HomePage() {
  const { playTrack } = useMusic();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Chào buổi sáng" : currentHour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  return (
    <div className="p-8 space-y-10 h-full overflow-y-auto scrollbar-none pb-28">
      {/* HEADER TƯƠNG TÁC */}
      <div className="flex items-end justify-between border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4" /> Dành riêng cho bạn
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">{greeting}, User!</h1>
        </div>
        <div className="hidden md:flex gap-3">
          <button className="bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-4 py-2 rounded-full border border-white/10 transition-all backdrop-blur-md">
            Nghe gần đây
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2">
            <Play className="w-3.5 h-3.5 fill-white" /> Phát Mix
          </button>
        </div>
      </div>

      {/* HERO BENTO GRID (KHỐI TO) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Khối nổi bật nhất */}
        <div className="lg:col-span-2 group relative h-64 rounded-3xl overflow-hidden border border-white/10 p-8 flex flex-col justify-end cursor-pointer">
          <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop" alt="Hero" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-500/30 backdrop-blur-md uppercase mb-3 inline-block">
                Album Mới Phát Hành
              </span>
              <h2 className="text-4xl font-black text-white drop-shadow-lg">Vũ Trụ Cò Bay</h2>
              <p className="text-white/70 font-medium mt-1">Phương Mỹ Chi • 10 Bài Hát</p>
            </div>
            <button className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform">
              <Play className="w-6 h-6 fill-black text-black ml-1" />
            </button>
          </div>
        </div>

        {/* Khối phụ */}
        <div className="group relative h-64 rounded-3xl overflow-hidden border border-white/10 p-6 flex flex-col justify-between cursor-pointer bg-gradient-to-br from-purple-900/40 to-indigo-900/40 hover:from-purple-800/50 hover:to-indigo-800/50 transition-colors">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white leading-tight">Top 50<br/>Việt Nam</h3>
            <Flame className="w-8 h-8 text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.8)]" />
          </div>
          <div className="relative z-10">
            <div className="flex -space-x-3 mb-3">
              {[1, 2, 3].map((i) => (
                <img key={i} src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Artist" className="w-8 h-8 rounded-full border-2 border-[#08070d]" />
              ))}
            </div>
            <p className="text-xs text-white/60">Cập nhật hàng ngày</p>
          </div>
        </div>
      </section>

      {/* LƯỚI BÀI HÁT TƯƠNG TỰ THƯ VIỆN */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Headphones className="w-5 h-5 text-indigo-400" /> Gợi ý hôm nay
          </h2>
          <button className="text-xs font-semibold text-white/50 hover:text-white flex items-center gap-1 transition-colors">
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topPicks.map((song) => (
            <div
              key={song.id}
              onClick={() => playTrack(song)}
              className="group relative bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 p-4 rounded-2xl flex items-center justify-between transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                  <img src={song.image} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                  </div>
                </div>

                <div className="truncate">
                  <h4 className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors truncate">{song.title}</h4>
                  <p className="text-xs text-white/50 truncate mt-0.5">{song.artist}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-medium text-indigo-300/80 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md">
                    {song.genre}
                  </span>
                </div>
              </div>

              <span className="text-xs font-mono text-white/40 ml-4">{song.duration}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}