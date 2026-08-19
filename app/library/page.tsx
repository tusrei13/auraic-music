"use client";

import { useState } from "react";
import { Heart, Play, Disc, Sparkles, Plus, Layers, Bookmark } from "lucide-react";
import { useMusic } from "@/context/MusicContext";

const likedSongs = [
  { id: 201, title: "Lối Nhỏ", artist: "Đen Vâu", genre: "Hip-Hop / Chill", image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", duration: "3:45" },
  { id: 202, title: "Tháng Tư Là Lời Nói Dối Của Em", artist: "Hà Anh Tuấn", genre: "Pop Acoustic", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", duration: "4:12" },
  { id: 203, title: "Có Chàng Trai Viết Lên Cây", artist: "Phan Mạnh Quỳnh", genre: "Indie Pop", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", duration: "5:01" },
  { id: 204, title: "Bước Qua Nhau", artist: "Vũ.", genre: "Indie Ballad", image: "https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=500&auto=format&fit=crop", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", duration: "4:30" },
];

const customPlaylists = [
  { id: 1, name: "Night Drive Vibes", count: "18 bài", color: "from-purple-600/40 to-blue-600/40", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=500&auto=format&fit=crop" },
  { id: 2, name: "Focus & Code", count: "32 bài", color: "from-emerald-600/40 to-teal-600/40", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=500&auto=format&fit=crop" },
  { id: 3, name: "Acoustic Sunday", count: "14 bài", color: "from-amber-600/40 to-orange-600/40", image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=500&auto=format&fit=crop" },
];

export default function LibraryPage() {
  const { playTrack } = useMusic();
  const [activeTab, setActiveTab] = useState<"all" | "playlists" | "liked">("all");

  return (
    <div className="p-8 space-y-10 h-full overflow-y-auto scrollbar-none pb-28">
      {/* HEADER HIỆN ĐẠI & BỘ CHUYỂN TAB (TỐI GIẢN) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Bookmark className="w-4 h-4" /> Space của riêng bạn
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Thư Viện Âm Nhạc</h1>
        </div>

        {/* NÚT CHUYỂN TABS PHONG CÁCH NEUMORPHISM */}
        <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "all" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-white/60 hover:text-white"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab("liked")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "liked" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-white/60 hover:text-white"
            }`}
          >
            Bài hát đã thích
          </button>
          <button
            onClick={() => setActiveTab("playlists")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "playlists" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-white/60 hover:text-white"
            }`}
          >
            Playlist cá nhân
          </button>
        </div>
      </div>

      {/* SECTION 1: BENTO GRID PLAYLIST (THAY CHO CÁC Ô PLAYLIST DỌC) */}
      {(activeTab === "all" || activeTab === "playlists") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Danh sách phát cá nhân
            </h2>
            <button className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full border border-indigo-500/20 transition-all">
              <Plus className="w-3.5 h-3.5" /> Tạo Playlist
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {customPlaylists.map((pl) => (
              <div
                key={pl.id}
                className="group relative h-40 rounded-2xl overflow-hidden border border-white/10 p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_10px_30px_rgba(99,102,241,0.2)]"
              >
                <img src={pl.image} alt={pl.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-50" />
                <div className={`absolute inset-0 bg-gradient-to-br ${pl.color} mix-blend-multiply`}></div>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 border border-white/20 px-2.5 py-1 rounded-full text-white/80 backdrop-blur-md">
                    {pl.count}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all shadow-md">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-200 transition-colors">{pl.name}</h3>
                  <p className="text-xs text-white/60 mt-0.5">Cập nhật gần đây</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 2: LƯỚI BÀI HÁT 2 CỘT (HOÀN TOÀN KHÔNG DÙNG DẠNG BẢNG HOẶC HÀNG DỌC ĐƠN ĐIỆU) */}
      {(activeTab === "all" || activeTab === "liked") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" /> Bài hát đã lưu ({likedSongs.length})
            </h2>
            <button 
              onClick={() => playTrack(likedSongs[0])}
              className="flex items-center gap-2 text-xs font-bold text-black bg-white hover:bg-white/90 px-4 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            >
              <Play className="w-3.5 h-3.5 fill-black" /> Phát tất cả
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {likedSongs.map((song) => (
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

                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs font-mono text-white/40">{song.duration}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-pink-500/10 text-pink-400 border border-pink-500/20">
                    <Heart className="w-4 h-4 fill-pink-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}