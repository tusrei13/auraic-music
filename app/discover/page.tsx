"use client";

import { useState } from "react";
import { Search, Compass, Play, Hash, Heart } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";

export const trendingTracks = [
  { 
    id: 101, 
    title: "Nốt Nhạc Trôi", 
    artist: "Chillies", 
    genre: "Indie Vietnam", 
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", 
    duration: "4:15",
    lyrics: [
      { time: 0, text: "Những nốt nhạc nhẹ nhàng trôi theo làn gió" },
      { time: 5, text: "Mang theo bao tâm tư gửi gắm vào không gian" },
      { time: 10, text: "Hương hoa thơm dịu dàng trong đêm muộn" },
    ]
  },
  { 
    id: 102, 
    title: "Dạ Vũ Không Tên", 
    artist: "Hoàng Dũng", 
    genre: "Indie Vietnam", 
    image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", 
    duration: "3:40",
    lyrics: [
      { time: 0, text: "Điệu nhảy dưới ánh đèn lung linh" },
      { time: 5, text: "Bên nhau trao nụ cười dưới đêm thâu" },
      { time: 10, text: "Khúc ca vang lên gọi nhớ kỷ niệm xưa" },
    ]
  },
  { 
    id: 103, 
    title: "Midnight City", 
    artist: "M83", 
    genre: "Synthwave", 
    image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", 
    duration: "4:00",
    lyrics: [
      { time: 0, text: "Waiting in a car, waiting for a ride in the dark" },
      { time: 5, text: "The night city is my playground" },
      { time: 10, text: "Sounds and lights everywhere" },
    ]
  },
  { 
    id: 104, 
    title: "Coffee & Rain", 
    artist: "Lofi Girl", 
    genre: "Lofi Chill", 
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", 
    duration: "2:30",
    lyrics: [
      { time: 0, text: "Tách cà phê ấm trên tay" },
      { time: 5, text: "Tiếng mưa rơi tí tách bên hiên nhà" },
      { time: 10, text: "Giai điệu lofi dịu êm xua tan mệt mỏi" },
    ]
  },
];

const genres = [
  { name: "Tất cả", color: "bg-white/10" },
  { name: "Indie Vietnam", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  { name: "Lofi Chill", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { name: "Synthwave", color: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30" },
];

export default function DiscoverPage() {
  // Lấy thêm currentTrack từ Zustand store để kiểm tra bài hát đang phát
  const { playTrack, toggleLike, likedIds, currentTrack } = usePlayerStore();
  
  const isLiked = (id: number) => likedIds.includes(id);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Tất cả");

  const filteredTracks = trendingTracks.filter(track => {
    const matchSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGenre = selectedGenre === "Tất cả" || track.genre === selectedGenre;
    return matchSearch && matchGenre;
  });

  return (
    <div className="p-8 space-y-10 h-full overflow-y-auto scrollbar-none pb-28">
      
      {/* THANH TÌM KIẾM NỔI */}
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-white/40" />
        </div>
        <input
          type="text"
          placeholder="Tìm bài hát, nghệ sĩ, hoặc album..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.05] border border-white/10 text-white rounded-full py-4 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/[0.08] transition-all backdrop-blur-md shadow-lg font-medium"
        />
      </div>

      {/* FILTER THỂ LOẠI */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-indigo-400" /> Khám phá thể loại
        </h2>
        <div className="flex flex-wrap gap-3">
          {genres.map((genre) => (
            <button
              key={genre.name}
              onClick={() => setSelectedGenre(genre.name)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold border transition-all ${
                selectedGenre === genre.name 
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
                  : `border-white/10 hover:bg-white/10 ${genre.color || 'text-white/70'}`
              }`}
            >
              {selectedGenre === genre.name && <Hash className="w-3.5 h-3.5 inline-block mr-1" />}
              {genre.name}
            </button>
          ))}
        </div>
      </div>

      {/* KẾT QUẢ HIỂN THỊ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h2 className="text-lg font-bold text-white">Kết quả nổi bật</h2>
          <span className="text-xs text-white/50">{filteredTracks.length} bài hát</span>
        </div>

        {filteredTracks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {filteredTracks.map((song) => {
              const liked = isLiked(song.id);
              const isPlayingThis = currentTrack?.id === song.id;

              return (
                <div
                  key={song.id}
                  onClick={() => playTrack(song, filteredTracks)}
                  className={`group relative p-4 rounded-2xl flex items-center justify-between transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl border ${
                    isPlayingThis
                      ? "bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.25)]"
                      : "bg-white/[0.04] hover:bg-white/[0.08] border-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                      <img src={song.image} alt={song.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      
                      {/* Sóng âm Equalizer nhảy khi bài hát này đang được phát */}
                      {isPlayingThis ? (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-1">
                          <span className="w-1 h-4 bg-indigo-400 rounded-full animate-[bounce_0.6s_infinite_100ms]"></span>
                          <span className="w-1 h-6 bg-indigo-400 rounded-full animate-[bounce_0.6s_infinite_300ms]"></span>
                          <span className="w-1 h-3 bg-indigo-400 rounded-full animate-[bounce_0.6s_infinite_200ms]"></span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                        </div>
                      )}
                    </div>

                    <div className="truncate">
                      <h4 className={`font-bold text-sm transition-colors truncate ${
                        isPlayingThis ? "text-indigo-400" : "text-white group-hover:text-indigo-300"
                      }`}>
                        {song.title}
                      </h4>
                      <p className="text-xs text-white/50 truncate mt-0.5">{song.artist}</p>
                      <span className="inline-block mt-1.5 text-[10px] font-medium bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 rounded-md">
                        {song.genre}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-xs font-mono text-white/40">{song.duration}</span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song.id);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                        liked ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" : "bg-white/5 text-white/40 hover:text-white"
                      }`}
                      title={liked ? "Bỏ thích" : "Yêu thích"}
                    >
                      <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-white/50 bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
            Không tìm thấy bài hát nào phù hợp với yêu cầu của bạn.
          </div>
        )}
      </section>

    </div>
  );
}