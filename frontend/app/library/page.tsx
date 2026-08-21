"use client";

import { useState } from "react";
import { Heart, Play, Plus, Layers, Bookmark, HeartOff, Clock } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";

export interface Track {
  id: number;
  title: string;
  artist: string;
  image: string;
  audioUrl: string;
  genre?: string;
  duration: string;
  lyrics?: { time: number; text: string }[];
}

export const ALL_SYSTEM_SONGS: Track[] = [
  { 
    id: 1, 
    title: "Chạy Ngay Đi", 
    artist: "Sơn Tùng M-TP", 
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    genre: "R&B / V-Pop",
    duration: "4:05",
    lyrics: [
      { time: 0, text: "Chạy ngay đi trước khi mọi chuyện dần xấu hơn" },
      { time: 5, text: "Chạy ngay đi trước khi dòng người lại đông hơn" },
      { time: 10, text: "Cơn mưa rơi rơi xóa đi hy vọng" },
      { time: 15, text: "Lạc trong hoang mang không tìm thấy lối ra" },
    ]
  },
  { 
    id: 2, 
    title: "Waiting For You", 
    artist: "MONO", 
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    genre: "City Pop",
    duration: "3:25",
    lyrics: [
      { time: 0, text: "Em ơi nhắn cho anh một câu" },
      { time: 5, text: "Để anh biết em vẫn còn chờ" },
      { time: 10, text: "Waiting for you, waiting for you all night" },
      { time: 15, text: "Màn đêm buông xuống chỉ riêng anh với đêm" },
    ]
  },
  { 
    id: 3, 
    title: "Chìm Sâu", 
    artist: "RPT MCK", 
    image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    genre: "Rap / Hip-Hop",
    duration: "2:58",
    lyrics: [
      { time: 0, text: "Tại vì anh chìm sâu vào trong ánh mắt em" },
      { time: 5, text: "Tại vì anh chìm sâu vào từng nụ cười ngây thơ" },
      { time: 10, text: "Mong cho thời gian dừng lại phút giây này" },
      { time: 15, text: "Để anh mãi được bên em" },
    ]
  },
  { 
    id: 4, 
    title: "See Tình", 
    artist: "Hoàng Thùy Linh", 
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    genre: "Dance Pop",
    duration: "3:10",
    lyrics: [
      { time: 0, text: "Giá như em không gặp anh" },
      { time: 5, text: "Giá như em không nhìn thấy anh" },
      { time: 10, text: "Thì giờ đây em đâu có tình yêu dại khùng" },
      { time: 15, text: "Tình yêu như món quà, anh là em muốn có" },
      { time: 20, text: "Phút ban đầu ấy, em thấy con tim mình đập nhanh" },
      { time: 25, text: "Chắc do là xem phim ngôn tình nhiều quá" },
      { time: 30, text: "Giờ đây em đã trót yêu anh mất rồi!" },
    ]
  },
  { 
    id: 101, 
    title: "Nốt Nhạc Trôi", 
    artist: "Chillies", 
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    genre: "Indie Vietnam",
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
    image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    genre: "Indie Vietnam",
    duration: "3:48",
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
    image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    genre: "Synthwave",
    duration: "4:03",
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
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    genre: "Lofi Chill",
    duration: "2:50",
    lyrics: [
      { time: 0, text: "Tách cà phê ấm trên tay" },
      { time: 5, text: "Tiếng mưa rơi tí tách bên hiên nhà" },
      { time: 10, text: "Giai điệu lofi dịu êm xua tan mệt mỏi" },
    ]
  },
  { 
    id: 201, 
    title: "Lối Nhỏ", 
    artist: "Đen Vâu", 
    image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    genre: "Rap / Hip-Hop",
    duration: "4:12",
    lyrics: [
      { time: 0, text: "Em vào đời bằng đại lộ, còn anh vào đời bằng lối nhỏ" },
      { time: 5, text: "Anh nhớ mình đã từng cùng nhau, qua những con đường đỏ" },
      { time: 10, text: "Cuộc đời này bao nhiêu lần mười năm" },
      { time: 15, text: "Anh muốn dịu dàng hơn, nhưng đời bắt anh phải gắt" },
      { time: 20, text: "Thế nên anh chọn cách yêu âm thầm từ xa" },
      { time: 25, text: "Chỉ mong em luôn bình yên trên lối em qua" },
    ]
  },
  { 
    id: 202, 
    title: "Tháng Tư Là Lời Nói Dối Của Em", 
    artist: "Hà Anh Tuấn", 
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    genre: "Ballad",
    duration: "5:15",
    lyrics: [
      { time: 0, text: "Mùa xuân giấu đi những lời nói dối" },
      { time: 5, text: "Tháng tư về, nắng nhẹ trên bờ vai" },
      { time: 10, text: "Anh đã từng tin lời em hứa" },
      { time: 15, text: "Rằng chúng ta sẽ mãi mãi bên nhau" },
      { time: 20, text: "Nhưng tháng tư đến, em rời xa mất rồi" },
      { time: 25, text: "Để lại anh cùng những ký ức nhạt màu" },
    ]
  },
  { 
    id: 203, 
    title: "Có Chàng Trai Viết Lên Cây", 
    artist: "Phan Mạnh Quỳnh", 
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    genre: "Pop Ballad",
    duration: "4:40",
    lyrics: [
      { time: 0, text: "Có chàng trai viết lên cây" },
      { time: 5, text: "Lời yêu thương gửi theo ngọn gió bay" },
      { time: 10, text: "Ngày tháng trôi qua, cây đã cao lớn rồi" },
      { time: 15, text: "Mà người năm ấy bây giờ ở đâu?" },
      { time: 20, text: "Những vết khắc năm xưa nay đã mờ đi" },
      { time: 25, text: "Chỉ còn kỷ niệm lưu giữ trong tim" },
    ]
  },
  { 
    id: 204, 
    title: "Bước Qua Nhau", 
    artist: "Vũ.", 
    image: "https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    genre: "Indie Pop",
    duration: "4:17",
    lyrics: [
      { time: 0, text: "Và rồi chúng ta bước qua nhau" },
      { time: 5, text: "Như hai người dưng ngược lối" },
      { time: 10, text: "Chẳng một câu chào, chẳng một cái nhìn" },
      { time: 15, text: "Dù trong lòng vẫn còn bao vương vấn" },
      { time: 20, text: "Cảm ơn em vì đã từng ghé qua" },
      { time: 25, text: "Thanh xuân này đẹp nhất là có em" },
    ]
  },
];

const customPlaylists = [
  { id: 1, name: "Night Drive Vibes", count: "18 bài", color: "from-purple-600/40 to-blue-600/40", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=500&auto=format&fit=crop" },
  { id: 2, name: "Focus & Code", count: "32 bài", color: "from-emerald-600/40 to-teal-600/40", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=500&auto=format&fit=crop" },
  { id: 3, name: "Acoustic Sunday", count: "14 bài", color: "from-amber-600/40 to-orange-600/40", image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=500&auto=format&fit=crop" },
];

export default function LibraryPage() {
  const { playTrack, toggleLike, likedIds, currentTrack, isPlaying } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<"all" | "playlists" | "liked">("all");

  const isLiked = (id: number) => likedIds.includes(id);
  const likedSongsList = ALL_SYSTEM_SONGS.filter((song) => isLiked(song.id));

  return (
    <div className="p-8 space-y-10 h-full overflow-y-auto scrollbar-none pb-28">
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Bookmark className="w-4 h-4" /> Space của riêng bạn
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Thư Viện Âm Nhạc</h1>
        </div>

        {/* BỘ CHUYỂN TAB */}
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
            Bài hát đã thích ({likedSongsList.length})
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

      {/* SECTION 1: PLAYLIST GRID */}
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

      {/* SECTION 2: BÀI HÁT ĐÃ LƯU */}
      {(activeTab === "all" || activeTab === "liked") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" /> Bài hát đã lưu ({likedSongsList.length})
            </h2>
            {likedSongsList.length > 0 && (
              <button 
                onClick={() => playTrack(likedSongsList[0], likedSongsList)}
                className="flex items-center gap-2 text-xs font-bold text-black bg-white hover:bg-white/90 px-4 py-2 rounded-full transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]"
              >
                <Play className="w-3.5 h-3.5 fill-black" /> Phát tất cả
              </button>
            )}
          </div>

          {likedSongsList.length > 0 ? (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
              {/* Header Bảng */}
              <div className="grid grid-cols-12 text-xs font-semibold text-white/40 px-6 py-3 border-b border-white/5 uppercase tracking-wider">
                <div className="col-span-1">#</div>
                <div className="col-span-8 md:col-span-9">Bài hát</div>
                <div className="col-span-3 md:col-span-2 text-right flex items-center justify-end gap-1">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Danh Sách Bài Hát Yêu Thích */}
              <div className="divide-y divide-white/[0.02]">
                {likedSongsList.map((song, index) => {
                  const liked = isLiked(song.id);
                  const isCurrent = currentTrack?.id === song.id;

                  return (
                    <div
                      key={song.id}
                      onClick={() => playTrack(song, likedSongsList)}
                      className={`grid grid-cols-12 items-center px-6 py-3.5 transition-all duration-200 cursor-pointer group ${
                        isCurrent
                          ? "bg-indigo-500/15 border-l-4 border-indigo-500"
                          : "hover:bg-white/[0.06]"
                      }`}
                    >
                      {/* Cột STT / Equalizer */}
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

                      {/* Cột Tên Bài Hát & Nghệ Sĩ */}
                      <div className="col-span-8 md:col-span-9 flex items-center gap-3.5 min-w-0">
                        <img src={song.image} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-md" />
                        <div className="truncate">
                          <h4 className={`text-sm font-semibold truncate ${isCurrent ? "text-indigo-400" : "text-white group-hover:text-indigo-300"}`}>
                            {song.title}
                          </h4>
                          <p className="text-xs text-white/50 truncate mt-0.5">{song.artist}</p>
                        </div>
                      </div>

                      {/* Cột Thao Tác & Thời Lượng Thực Tế */}
                      <div className="col-span-3 md:col-span-2 flex items-center justify-end gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(song.id);
                          }}
                          className="text-white/40 hover:text-pink-500 transition-colors p-1"
                          title={liked ? "Bỏ thích" : "Yêu thích"}
                        >
                          <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
                        </button>
                        <span className="text-xs font-mono text-white/40">{song.duration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-white/[0.02] space-y-3">
              <HeartOff className="w-10 h-10 text-white/20 mx-auto" />
              <p className="text-white/40 text-sm">Chưa có bài hát nào trong danh sách yêu thích</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}