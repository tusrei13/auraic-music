"use client";

import { useState, useEffect } from "react";
import { 
  Heart, 
  Play, 
  Plus, 
  Layers, 
  Bookmark, 
  Clock, 
  X, 
  Trash2, 
  Check, 
  ChevronLeft, 
  Shuffle, 
  Search, 
  Sparkles,
  Disc
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import TrackActionMenu from "@/components/TrackActionMenu";

export interface Track {
  id: number | string;
  title: string;
  artist: string | { name: string };
  image: string;
  audioUrl: string;
  genre?: string;
  album?: string;
  addedAt?: string;
  duration?: string;
}

export interface Playlist {
  id: number | string;
  name: string;
  description?: string;
  songIds: (number | string)[];
  color: string;
  image: string;
  createdAt: string;
}

export const ALL_SYSTEM_SONGS: Track[] = [
  { 
    id: 1, 
    title: "Chúng Ta Của Tương Lai", 
    artist: "Sơn Tùng M-TP", 
    album: "Chúng Ta Của Tương Lai (Single)",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    genre: "Pop / R&B",
    addedAt: "2 ngày trước",
    duration: "03:38",
  },
  { 
    id: 2, 
    title: "Nấu Ăn Cho Em", 
    artist: "Đen Vâu ft. PiaLinh", 
    album: "Nấu Ăn Cho Em",
    image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    genre: "Hip-Hop / Rap",
    addedAt: "1 tuần trước",
    duration: "04:12",
  },
  { 
    id: 3, 
    title: "Chạy Ngay Đi", 
    artist: "Sơn Tùng M-TP", 
    album: "Chạy Ngay Đi",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    genre: "Hip-Hop / Trap",
    addedAt: "3 tuần trước",
    duration: "04:05",
  },
  { 
    id: 4, 
    title: "Waiting For You", 
    artist: "MONO", 
    album: "22",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    genre: "Synth-Pop",
    addedAt: "1 tháng trước",
    duration: "03:25",
  },
  { 
    id: 5, 
    title: "Chìm Sâu", 
    artist: "RPT MCK ft. Trung Trần", 
    album: "99%",
    image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    genre: "R&B / Soul",
    addedAt: "1 tháng trước",
    duration: "02:58",
  },
  { 
    id: 6, 
    title: "See Tình", 
    artist: "Hoàng Thùy Linh", 
    album: "LINK",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    genre: "Dance Pop",
    addedAt: "2 tháng trước",
    duration: "03:10",
  },
  { 
    id: 101, 
    title: "Nốt Nhạc Trôi", 
    artist: "Chillies", 
    album: "Qua Khung Cửa Sổ",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    genre: "Indie Rock",
    addedAt: "2 tháng trước",
    duration: "04:15",
  },
  { 
    id: 102, 
    title: "Dạ Vũ Không Tên", 
    artist: "Hoàng Dũng", 
    album: "25",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop", 
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    genre: "Ballad",
    addedAt: "3 tháng trước",
    duration: "03:40",
  },
];

const initialPlaylists: Playlist[] = [
  { 
    id: 1, 
    name: "Night Drive Vibes", 
    description: "Thả mình vào những giai điệu Synthwave và R&B huyền ảo dọc phố đêm.",
    songIds: [3, 4, 5], 
    color: "from-purple-900/80 via-indigo-900/50 to-[#0b0c10]", 
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=500&auto=format&fit=crop",
    createdAt: "15 Th08, 2026"
  },
  { 
    id: 2, 
    name: "Focus & Code", 
    description: "Âm nhạc tập trung tối đa cho những giờ làm việc căng thẳng.",
    songIds: [101, 102], 
    color: "from-emerald-900/80 via-teal-900/50 to-[#0b0c10]", 
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=500&auto=format&fit=crop",
    createdAt: "10 Th08, 2026"
  },
  { 
    id: 3, 
    name: "Acoustic Sunday", 
    description: "Giai điệu mộc mạc và êm dịu cho ngày cuối tuần nhẹ nhàng.",
    songIds: [1, 2, 6], 
    color: "from-amber-900/80 via-orange-900/50 to-[#0b0c10]", 
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=500&auto=format&fit=crop",
    createdAt: "01 Th08, 2026"
  },
];

const STORAGE_KEY = "auraic_user_playlists";

export default function LibraryPage() {
  const { likedIds, currentTrack, isPlaying, toggleLike, playTrack } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<"all" | "playlists" | "liked">("all");
  const [playlists, setPlaylists] = useState<Playlist[]>(initialPlaylists);
  const [isLoaded, setIsLoaded] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("");
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | string | null>(null);

  useEffect(() => {
    try {
      const savedPlaylists = localStorage.getItem(STORAGE_KEY);
      if (savedPlaylists) {
        setPlaylists(JSON.parse(savedPlaylists));
      }
    } catch (error) {
      console.error("Lỗi đọc Playlist từ localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
      } catch (error) {
        console.error("Lỗi lưu Playlist vào localStorage:", error);
      }
    }
  }, [playlists, isLoaded]);

  const isLiked = (id: number | string) => {
    return (likedIds || []).some((likedId) => String(likedId) === String(id));
  };

  const sourceTracks: Track[] = ALL_SYSTEM_SONGS;
  const likedSongsList: Track[] = sourceTracks.filter((song: Track) => isLiked(song.id));

  const handlePlaySong = (song: Track, list?: Track[], contextTitle?: string) => {
    playTrack(song, list || sourceTracks, contextTitle);
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPl: Playlist = {
      id: Date.now(),
      name: newPlaylistName.trim(),
      description: "Playlist cá nhân mới tạo trên AURAIC Sound Space.",
      songIds: [],
      color: "from-indigo-900/80 via-purple-900/50 to-[#0b0c10]",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop",
      createdAt: "Vừa xong"
    };

    setPlaylists([newPl, ...playlists]);
    setNewPlaylistName("");
    setShowCreateModal(false);
    setSelectedPlaylistId(newPl.id);
  };

  const handleDeletePlaylist = (playlistId: number | string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (window.confirm("Bạn có chắc chắn muốn xóa danh sách phát này?")) {
      setPlaylists((prev) => prev.filter((p) => String(p.id) !== String(playlistId)));
      if (String(selectedPlaylistId) === String(playlistId)) {
        setSelectedPlaylistId(null);
      }
    }
  };

  const toggleSongInPlaylist = (playlistId: number | string, songId: number | string) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (String(pl.id) === String(playlistId)) {
          const exists = pl.songIds.some((id) => String(id) === String(songId));
          const updatedSongIds = exists
            ? pl.songIds.filter((id) => String(id) !== String(songId))
            : [...pl.songIds, songId];
          return { ...pl, songIds: updatedSongIds };
        }
        return pl;
      })
    );
  };

  const getArtistName = (artist: any) => {
    if (typeof artist === "object" && artist !== null) {
      return artist.name || "Ca sĩ chưa xác định";
    }
    return artist || "Ca sĩ chưa xác định";
  };

  const activePlaylist = playlists.find((p) => String(p.id) === String(selectedPlaylistId));
  const activePlaylistSongs = activePlaylist
    ? sourceTracks
        .filter((song) => activePlaylist.songIds.some((id) => String(id) === String(song.id)))
        .filter((song) => 
          song.title.toLowerCase().includes(playlistSearchQuery.toLowerCase()) ||
          getArtistName(song.artist).toLowerCase().includes(playlistSearchQuery.toLowerCase())
        )
    : [];

  const handleShufflePlay = () => {
    if (activePlaylistSongs.length === 0) return;

    const shuffledList = [...activePlaylistSongs].sort(() => Math.random() - 0.5);
    setIsShuffleActive(!isShuffleActive);
    
    handlePlaySong(shuffledList[0], shuffledList, activePlaylist?.name);
  };

  if (activePlaylist) {
    return (
      <div className="min-h-full overflow-y-auto scrollbar-none pb-28 text-white relative bg-[#09090b]">
        <div className={`absolute top-0 left-0 right-0 h-96 bg-gradient-to-b ${activePlaylist.color} opacity-80 pointer-events-none blur-3xl`} />

        <div className="relative z-10 p-8 space-y-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedPlaylistId(null);
                setIsShuffleActive(false);
              }}
              className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-full text-white border border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại Thư viện
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-full backdrop-blur-md">
                AURAIC Space Playlist
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-end gap-8 pt-4">
            <div className="relative group flex-shrink-0">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-50 blur-xl group-hover:opacity-75 transition-all"></div>
              <img
                src={activePlaylist.image}
                alt={activePlaylist.name}
                className="relative w-52 h-52 sm:w-60 sm:h-60 object-cover rounded-2xl shadow-2xl border border-white/20"
              />
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Danh Sách Phát Cá Nhân
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight drop-shadow-md">
                {activePlaylist.name}
              </h1>

              <p className="text-sm text-white/70 max-w-2xl leading-relaxed">
                {activePlaylist.description || "Giai điệu tuyển chọn dành riêng cho trải nghiệm âm nhạc của bạn."}
              </p>

              <div className="flex items-center flex-wrap gap-4 text-xs font-semibold text-white/80 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">
                    AU
                  </div>
                  <span className="text-white font-bold">Người dùng AURAIC</span>
                </div>
                <span>•</span>
                <span>{activePlaylist.songIds.length} bài hát</span>
                <span>•</span>
                <span className="text-white/50">Tạo ngày {activePlaylist.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  if (activePlaylistSongs.length > 0) {
                    handlePlaySong(activePlaylistSongs[0], activePlaylistSongs, activePlaylist.name);
                  }
                }}
                disabled={activePlaylistSongs.length === 0}
                className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 disabled:opacity-40 text-black flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Play className="w-6 h-6 fill-white text-white ml-1" />
              </button>

              <button 
                onClick={handleShufflePlay}
                disabled={activePlaylistSongs.length === 0}
                className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer transform hover:scale-105 active:scale-95 disabled:opacity-40 ${
                  isShuffleActive 
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)]" 
                    : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10"
                }`}
                title={isShuffleActive ? "Đang bật phát ngẫu nhiên" : "Tắt phát ngẫu nhiên"}
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowAddSongsModal(true)}
                className="flex items-center gap-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm bài hát
              </button>

              <button
                onClick={() => handleDeletePlaylist(activePlaylist.id)}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                title="Xóa Playlist này"
              >
                <Trash2 className="w-4 h-4" /> Xóa Playlist
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Tìm bài hát trong playlist..."
                  value={playlistSearchQuery}
                  onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {activePlaylistSongs.length > 0 ? (
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl relative">
              <div className="grid grid-cols-12 text-xs font-black text-white/40 px-6 py-4 border-b border-white/10 uppercase tracking-wider rounded-t-3xl">
                <div className="col-span-1">#</div>
                <div className="col-span-5 sm:col-span-4">Tiêu đề bài hát</div>
                <div className="hidden sm:block sm:col-span-3">Album / Thể loại</div>
                <div className="hidden md:block md:col-span-2">Ngày thêm</div>
                <div className="col-span-6 sm:col-span-4 md:col-span-2 text-right flex items-center justify-end gap-2">
                  <Clock className="w-4 h-4" /> Thời lượng
                </div>
              </div>

              <div className="divide-y divide-white/[0.03]">
                {activePlaylistSongs.map((song: Track, index: number) => {
                  const isCurrent = String(currentTrack?.id) === String(song.id);
                  const liked = isLiked(song.id);

                  return (
                    <div
                      key={song.id}
                      style={{ zIndex: activePlaylistSongs.length - index }}
                      onClick={() => handlePlaySong(song, activePlaylistSongs, activePlaylist.name)}
                      className={`grid grid-cols-12 items-center px-6 py-4 transition-all duration-200 cursor-pointer group relative ${
                        index === activePlaylistSongs.length - 1 ? "rounded-b-3xl" : ""
                      } ${
                        isCurrent
                          ? "bg-indigo-500/20 border-l-4 border-indigo-500 text-white"
                          : "hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="col-span-1 text-xs font-mono font-bold text-white/40">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-3.5 bg-indigo-400 rounded-full animate-bounce"></span>
                            <span className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
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

                      <div className="col-span-5 sm:col-span-4 flex items-center gap-3.5 min-w-0 pr-2">
                        <img 
                          src={song.image} 
                          alt={song.title} 
                          className="w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-lg border border-white/10" 
                        />
                        <div className="truncate">
                          <h4 className={`text-sm font-bold truncate ${isCurrent ? "text-indigo-400" : "text-white group-hover:text-indigo-300"}`}>
                            {song.title}
                          </h4>
                          <p className="text-xs text-white/50 truncate mt-0.5">{getArtistName(song.artist)}</p>
                        </div>
                      </div>

                      <div className="hidden sm:block sm:col-span-3 text-xs text-white/60 truncate pr-2">
                        <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-[11px]">
                          {song.album || song.genre || "AURAIC Original"}
                        </span>
                      </div>

                      <div className="hidden md:block md:col-span-2 text-xs text-white/40">
                        {song.addedAt || "Vừa xong"}
                      </div>

                      <div className="col-span-6 sm:col-span-4 md:col-span-2 flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(song.id);
                          }}
                          className="text-white/30 hover:text-pink-500 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                          title={liked ? "Bỏ thích" : "Yêu thích"}
                        >
                          <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSongInPlaylist(activePlaylist.id, song.id);
                          }}
                          className="text-white/30 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                          title="Xóa khỏi Playlist này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <TrackActionMenu track={song} />

                        <span className="text-xs font-mono font-semibold text-white/50 ml-1">
                          {song.duration || "03:30"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.01] backdrop-blur-xl space-y-4">
              <Disc className="w-12 h-12 text-white/20 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Chưa có bài hát nào trong Playlist này</h3>
                <p className="text-xs text-white/40">Hãy tìm kiếm hoặc thêm những bài hát yêu thích của bạn vào đây.</p>
              </div>
              <button
                onClick={() => setShowAddSongsModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-3 rounded-full transition-all shadow-lg shadow-indigo-600/30"
              >
                + Thêm bài hát ngay
              </button>
            </div>
          )}
        </div>

        {showAddSongsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col space-y-5 shadow-2xl relative">
              <button
                onClick={() => setShowAddSongsModal(false)}
                className="absolute top-5 right-5 text-white/50 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-xl font-bold text-white">Thêm bài hát vào Playlist</h3>
                <p className="text-xs text-indigo-400 mt-1">Playlist: {activePlaylist.name}</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none divide-y divide-white/5">
                {sourceTracks.map((song) => {
                  const isAdded = activePlaylist.songIds.some((id) => String(id) === String(song.id));

                  return (
                    <div
                      key={song.id}
                      onClick={() => toggleSongInPlaylist(activePlaylist.id, song.id)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                        isAdded ? "bg-indigo-600/15 border border-indigo-500/30" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={song.image} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="truncate">
                          <h5 className="text-sm font-bold text-white truncate">{song.title}</h5>
                          <p className="text-xs text-white/50 truncate">{getArtistName(song.artist)}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isAdded
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Đã chọn
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" /> Thêm
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => setShowAddSongsModal(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg"
              >
                Xong
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 h-full overflow-y-auto scrollbar-none pb-28 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Bookmark className="w-4 h-4" /> Space của riêng bạn
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Thư Viện Âm Nhạc</h1>
        </div>

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
            Playlist cá nhân ({playlists.length})
          </button>
        </div>
      </div>

      {(activeTab === "all" || activeTab === "playlists") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Danh sách phát cá nhân
            </h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-2 rounded-full border border-indigo-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo Playlist
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setSelectedPlaylistId(pl.id)}
                className="group relative h-44 rounded-2xl overflow-hidden border border-white/10 p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_10px_30px_rgba(99,102,241,0.25)]"
              >
                <img src={pl.image} alt={pl.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-30 group-hover:opacity-40" />
                <div className={`absolute inset-0 bg-gradient-to-br ${pl.color} mix-blend-multiply`}></div>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 border border-white/20 px-2.5 py-1 rounded-full text-white/80 backdrop-blur-md">
                    {pl.songIds.length} bài hát
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeletePlaylist(pl.id, e)}
                      className="w-8 h-8 rounded-full bg-black/40 hover:bg-red-500/80 text-white/60 hover:text-white border border-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110"
                      title="Xóa Playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-white/10 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all shadow-md group-hover:scale-110">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors truncate">{pl.name}</h3>
                  <p className="text-xs text-white/60 mt-1 truncate">{pl.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {(activeTab === "all" || activeTab === "liked") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" /> Bài hát đã thích ({likedSongsList.length})
            </h2>
            {likedSongsList.length > 0 && (
              <button 
                onClick={() => handlePlaySong(likedSongsList[0], likedSongsList, "Bài hát đã thích")}
                className="flex items-center gap-2 text-xs font-bold text-black bg-white hover:bg-white/90 px-4 py-2 rounded-full transition-all shadow-lg"
              >
                <Play className="w-3.5 h-3.5 fill-black" /> Phát tất cả
              </button>
            )}
          </div>

          {likedSongsList.length > 0 ? (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm relative">
              <div className="grid grid-cols-12 text-xs font-semibold text-white/40 px-6 py-3 border-b border-white/5 uppercase tracking-wider rounded-t-2xl">
                <div className="col-span-1">#</div>
                <div className="col-span-8">Bài hát</div>
                <div className="col-span-3 text-right">Tùy chọn</div>
              </div>

              <div className="divide-y divide-white/[0.02]">
                {likedSongsList.map((song: Track, index: number) => {
                  const isCurrent = String(currentTrack?.id) === String(song.id);

                  return (
                    <div
                      key={song.id}
                      style={{ zIndex: likedSongsList.length - index }}
                      onClick={() => handlePlaySong(song, likedSongsList, "Bài hát đã thích")}
                      className={`grid grid-cols-12 items-center px-6 py-3.5 transition-all duration-200 cursor-pointer group relative ${
                        index === likedSongsList.length - 1 ? "rounded-b-2xl" : ""
                      } ${
                        isCurrent ? "bg-indigo-500/15 border-l-4 border-indigo-500" : "hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="col-span-1 text-xs font-mono font-bold text-white/40">
                        {index + 1 < 10 ? `0${index + 1}` : index + 1}
                      </div>

                      <div className="col-span-8 flex items-center gap-3.5 min-w-0">
                        <img src={song.image} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="truncate">
                          <h4 className={`text-sm font-semibold truncate ${isCurrent ? "text-indigo-400" : "text-white"}`}>{song.title}</h4>
                          <p className="text-xs text-white/50 truncate">{getArtistName(song.artist)}</p>
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(song.id);
                          }}
                          className="text-pink-500 hover:text-pink-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                          title="Bỏ thích"
                        >
                          <Heart className="w-4 h-4 fill-pink-500" />
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
              <p className="text-white/40 text-sm">Chưa có bài hát nào trong danh sách yêu thích</p>
            </div>
          )}
        </section>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-5 right-5 text-white/50 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-white">Tạo Playlist Mới</h3>
              <p className="text-xs text-white/50 mt-1">Nhập tên danh sách phát của bạn</p>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <input 
                type="text" 
                placeholder="Tên playlist..." 
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-all"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white">
                  Hủy
                </button>
                <button type="submit" disabled={!newPlaylistName.trim()} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg">
                  Tạo Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}