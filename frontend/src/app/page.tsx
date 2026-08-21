"use client";

import { useEffect, useState } from "react";
import { Play, Sparkles, Flame, Headphones, Search, X, Heart, Clock, Loader2 } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getSongs } from "@/lib/api";
import TrackActionMenu from "@/components/TrackActionMenu";

export default function HomePage() {
  const { playMix, playTrack, toggleLike, likedIds, currentTrack, isPlaying } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSongs()
      .then((data) => setSongs(data))
      .catch((err) => console.error("Lỗi tải bài hát từ API:", err))
      .finally(() => setLoading(false));
  }, []);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Chào buổi sáng" : currentHour < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  const filteredSongs = songs.filter((song) => {
    const artistName = typeof song.artist === "object" ? song.artist?.name : song.artist;
    return (
      song.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artistName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto scrollbar-none pb-28 text-white">
      {/* HEADER & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4" /> Dành riêng cho bạn
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">{greeting}!</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Tìm bài hát, ca sĩ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/50 rounded-full pl-10 pr-9 py-2 text-xs text-white placeholder-white/40 focus:outline-none backdrop-blur-md transition-all focus:bg-white/10"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button 
            onClick={() => songs.length > 0 && playMix(songs)} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2 flex-shrink-0 disabled:opacity-50 cursor-pointer"
            disabled={songs.length === 0}
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Phát Mix
          </button>
        </div>
      </div>

      {/* HERO GRID */}
      {!searchQuery && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 group relative h-64 rounded-3xl overflow-hidden border border-white/10 p-8 flex flex-col justify-end cursor-pointer">
            <img 
              src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop" 
              alt="Hero" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
            
            <div className="relative z-10 flex justify-between items-end">
              <div>
                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-3 py-1 rounded-full border border-indigo-500/30 backdrop-blur-md uppercase mb-3 inline-block">
                  Album Mới Phát Hành
                </span>
                <h2 className="text-4xl font-black text-white drop-shadow-lg">Vũ Trụ Cò Bay</h2>
                <p className="text-white/70 font-medium mt-1">Phương Mỹ Chi • 10 Bài Hát</p>
              </div>
              <button 
                onClick={() => songs.length > 0 && playMix(songs)}
                className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform cursor-pointer"
              >
                <Play className="w-6 h-6 fill-black text-black ml-1" />
              </button>
            </div>
          </div>

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
      )}

      {/* DANH SÁCH BÀI HÁT */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Headphones className="w-5 h-5 text-indigo-400" /> 
            {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : "Gợi ý hôm nay"}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-white/50 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Đang tải bài hát từ API...</span>
          </div>
        ) : filteredSongs.length > 0 ? (
          /* Đã bỏ overflow-hidden ở đây để menu không bị cắt */
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm shadow-2xl relative">
            <div className="grid grid-cols-12 text-xs font-semibold text-white/40 px-6 py-3 border-b border-white/5 uppercase tracking-wider rounded-t-2xl">
              <div className="col-span-1">#</div>
              <div className="col-span-6 md:col-span-5">Bài hát</div>
              <div className="hidden md:block md:col-span-4">Thể loại</div>
              <div className="col-span-5 md:col-span-2 text-right flex items-center justify-end gap-1">
                <Clock className="w-3.5 h-3.5" /> Thời lượng
              </div>
            </div>

            <div className="divide-y divide-white/[0.02]">
              {filteredSongs.map((song, index) => {
                const liked = likedIds.some((id: any) => String(id) === String(song.id));
                const isCurrent = String(currentTrack?.id) === String(song.id);
                const artistName = typeof song.artist === "object" ? song.artist?.name : song.artist;
                const genreName = typeof song.genre === "object" ? song.genre?.name : song.genre || "V-Pop";

                return (
                  <div
                    key={song.id}
                    onClick={() => playTrack(song, songs)}
                    /* Thêm relative hover:z-20 để menu mở ra nằm đè lên hàng bên dưới */
                    className={`grid grid-cols-12 items-center px-6 py-3.5 transition-all duration-200 cursor-pointer group relative hover:z-20 ${
                      isCurrent
                        ? "bg-indigo-500/15 border-l-4 border-indigo-500 z-10"
                        : "hover:bg-white/[0.06] z-0"
                    }`}
                  >
                    <div className="col-span-1 text-xs font-mono font-bold text-white/40">
                      {isCurrent && isPlaying ? (
                        <div className="flex items-center gap-0.5">
                          <span className="w-1 h-3 bg-indigo-400 rounded-full animate-bounce"></span>
                          <span className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-1 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      ) : (
                        <span className={isCurrent ? "text-indigo-400" : "group-hover:hidden"}>
                          {index + 1 < 10 ? `0${index + 1}` : index + 1}
                        </span>
                      )}
                      {!isCurrent && (
                        <Play className="w-4 h-4 text-white fill-white hidden group-hover:block" />
                      )}
                    </div>

                    <div className="col-span-6 md:col-span-5 flex items-center gap-3.5 min-w-0 pr-2">
                      <img src={song.image} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-md" />
                      <div className="truncate">
                        <h4 className={`text-sm font-semibold truncate ${isCurrent ? "text-indigo-400" : "text-white group-hover:text-indigo-300"}`}>
                          {song.title}
                        </h4>
                        <p className="text-xs text-white/50 truncate mt-0.5">{artistName}</p>
                      </div>
                    </div>

                    <div className="hidden md:block md:col-span-4">
                      <span className="text-[11px] font-medium text-white/60 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                        {genreName}
                      </span>
                    </div>

                    <div className="col-span-5 md:col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(song);
                        }}
                        className="text-white/40 hover:text-pink-500 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                        title={liked ? "Bỏ thích" : "Yêu thích"}
                      >
                        <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
                      </button>

                      <TrackActionMenu track={song} />

                      <span className="text-xs font-mono text-white/40 ml-1">{song.duration || "03:30"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
            <p className="text-white/40 text-sm">Không tìm thấy bài hát hoặc ca sĩ nào phù hợp với "{searchQuery}"</p>
          </div>
        )}
      </section>
    </div>
  );
}