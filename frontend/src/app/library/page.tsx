"use client";

import Artwork from "@/components/Artwork";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  Disc,
  AlertTriangle,
  Loader2
  ,ArrowDown, ArrowUp
} from "lucide-react";
import { usePlayerStore, Track as StoreTrack, type LocalListeningHistoryItem } from "@/store/usePlayerStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import TrackActionMenu from "@/components/TrackActionMenu";
import { formatDuration, getListeningHistory, getSongs } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";

export type Track = StoreTrack & {
  addedAt?: string;
  [key: string]: any;
};

const getStringValue = (val: any, fallback = ""): string => {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    return val.name || val.title || val.label || fallback;
  }
  return fallback;
};

const getArtistName = (artist: any): string => {
  if (!artist) return "Ca sĩ chưa xác định";
  if (typeof artist === "object") {
    return artist.name || artist.title || "Ca sĩ chưa xác định";
  }
  return String(artist);
};

export default function LibraryPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  const { likedIds, likedTracks, currentTrack, isPlaying, toggleLike, playTrack } = usePlayerStore();
  const playlistStore = usePlaylistStore() as any;
  const hydratePlaylists = usePlaylistStore((state) => state.hydrate);
  const playlists = playlistStore.playlists || [];

  const [systemSongs, setSystemSongs] = useState<Track[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  const [activeTab, setActiveTab] = useState<"all" | "playlists" | "liked" | "history">("all");
  const [listeningHistory, setListeningHistory] = useState<LocalListeningHistoryItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<{ id: number | string; name: string } | null>(null);
  
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("");
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | string | null>(null);
  const authStatus = useAuthStore((state) => state.status);

  // Tải danh sách bài hát thực tế từ Database
  useEffect(() => {
    getSongs()
      .then((data) => {
        setSystemSongs(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Lỗi tải bài hát cho Thư viện:", err))
      .finally(() => setLoadingSongs(false));
  }, []);

  useEffect(() => {
    void hydratePlaylists();
  }, [hydratePlaylists]);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setListeningHistory([]);
      return;
    }

    const loadHistory = () => {
      let localHistory: LocalListeningHistoryItem[] = [];
      try {
        const stored = JSON.parse(localStorage.getItem(`auraic-history-${useAuthStore.getState().user?.id}`) || "[]");
        if (Array.isArray(stored)) localHistory = stored;
      } catch {
        localHistory = [];
      }
      getListeningHistory()
        .then((history) => setListeningHistory([...localHistory, ...(history as LocalListeningHistoryItem[])].slice(0, 50)))
        .catch(() => setListeningHistory(localHistory));
    };

    loadHistory();
    window.addEventListener("auraic:history-updated", loadHistory);
    return () => window.removeEventListener("auraic:history-updated", loadHistory);
  }, [authStatus]);

  const sourceTracks: Track[] = systemSongs;

  const isLiked = (id: number | string) => {
    return (likedIds || []).some((likedId) => String(likedId) === String(id));
  };

  const likedSongsList: Track[] = [...likedTracks, ...sourceTracks.filter((song: Track) => isLiked(song.id))]
    .filter((song, index, list) => list.findIndex((item) => String(item.id) === String(song.id)) === index);

  const handlePlaySong = (song: Track, list?: Track[], contextTitle?: string) => {
    playTrack(song as any, (list || sourceTracks) as any, contextTitle);
  };

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    if (playlistStore.createPlaylist) {
      playlistStore.createPlaylist(newPlaylistName.trim());
    }
    setNewPlaylistName("");
    setShowCreateModal(false);
  };

  const handleOpenDeleteModal = (playlistId: number | string, playlistName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlaylistToDelete({ id: playlistId, name: playlistName });
  };

  const handleConfirmDelete = () => {
    if (!playlistToDelete) return;

    if (playlistStore.deletePlaylist) {
      playlistStore.deletePlaylist(playlistToDelete.id);
    }
    if (String(selectedPlaylistId) === String(playlistToDelete.id)) {
      setSelectedPlaylistId(null);
    }
    setPlaylistToDelete(null);
  };

  const handleToggleSongInPlaylist = (playlistId: number | string, song: Track) => {
    const store = playlistStore;
    const targetPl = (store.playlists || []).find((p: any) => String(p.id) === String(playlistId));
    
    if (store.toggleSongInPlaylist) {
      store.toggleSongInPlaylist(playlistId, song);
      return;
    }
    if (store.toggleTrackInPlaylist) {
      store.toggleTrackInPlaylist(playlistId, song);
      return;
    }

    const isAdded = targetPl && (
      (targetPl.tracks && targetPl.tracks.some((t: any) => String(t.id || t) === String(song.id))) ||
      (targetPl.songIds && targetPl.songIds.some((id: any) => String(id) === String(song.id)))
    );

    if (isAdded) {
      if (store.removeTrackFromPlaylist) store.removeTrackFromPlaylist(playlistId, song.id);
      else if (store.removeSongFromPlaylist) store.removeSongFromPlaylist(playlistId, song.id);
    } else {
      if (store.addTrackToPlaylist) store.addTrackToPlaylist(playlistId, song);
      else if (store.addSongToPlaylist) store.addSongToPlaylist(playlistId, song);
    }
  };

  const handleMoveSong = (index: number, direction: -1 | 1) => {
    if (!activePlaylist || index + direction < 0 || index + direction >= activePlaylistSongs.length) return;
    const reordered = [...activePlaylistSongs];
    [reordered[index], reordered[index + direction]] = [reordered[index + direction], reordered[index]];
    void playlistStore.reorderTracksInPlaylist?.(activePlaylist.id, reordered.map((song: Track) => song.id));
  };

  const activePlaylist = playlists.find((p: any) => String(p.id) === String(selectedPlaylistId));

  const activePlaylistSongIds: (number | string)[] = activePlaylist
    ? [
        ...(activePlaylist.songIds || []),
        ...((activePlaylist.tracks || []).map((t: any) => t.id || t))
      ]
    : [];

  const activePlaylistSongs = activePlaylist
    ? [
        ...(activePlaylist.tracks || []),
        ...sourceTracks.filter((song) =>
          activePlaylistSongIds.some((id) => String(id) === String(song.id))
        )
      ]
        .filter((song, idx, self) => idx === self.findIndex((s) => String(s.id) === String(song.id)))
        .filter((song) => 
          getStringValue(song.title).toLowerCase().includes(playlistSearchQuery.toLowerCase()) ||
          getArtistName(song.artist).toLowerCase().includes(playlistSearchQuery.toLowerCase())
        )
    : [];

  const handleShufflePlay = () => {
    if (activePlaylistSongs.length === 0) return;

    const shuffledList = [...activePlaylistSongs].sort(() => Math.random() - 0.5);
    setIsShuffleActive(!isShuffleActive);
    
    const plName = getStringValue(activePlaylist?.name || activePlaylist?.title, "Playlist");
    handlePlaySong(shuffledList[0], shuffledList, plName);
  };

  if (loadingSongs) {
    return (
      <div className="flex items-center justify-center h-full text-white/50 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <span className="text-sm font-medium">Đang tải Thư viện...</span>
      </div>
    );
  }

  if (activePlaylist) {
    const playlistTitle = getStringValue(activePlaylist.name || activePlaylist.title, "Playlist");
    const playlistColor = getStringValue(activePlaylist.color, "from-indigo-900/80 via-purple-900/50 to-[#0b0c10]");
    const playlistImage = getStringValue(activePlaylist.image, "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop");

    return (
      <div className="min-h-full overflow-y-auto scrollbar-none pb-28 text-white relative bg-[#09090b]">
        <div className={`absolute top-0 left-0 right-0 h-96 bg-gradient-to-b ${playlistColor} opacity-80 pointer-events-none blur-3xl`} />

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
              <Artwork
                src={playlistImage}
                alt={playlistTitle}
                className="relative w-52 h-52 sm:w-60 sm:h-60 object-cover rounded-2xl shadow-2xl border border-white/20"
              />
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Danh Sách Phát Cá Nhân
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight drop-shadow-md">
                {playlistTitle}
              </h1>

              <p className="text-sm text-white/70 max-w-2xl leading-relaxed">
                {getStringValue(activePlaylist.description, "Giai điệu tuyển chọn dành riêng cho trải nghiệm âm nhạc của bạn.")}
              </p>

              <div className="flex items-center flex-wrap gap-4 text-xs font-semibold text-white/80 pt-2 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">
                    AU
                  </div>
                  <span className="text-white font-bold">Người dùng AURAIC</span>
                </div>
                <span>•</span>
                <span>{activePlaylistSongs.length} bài hát</span>
                <span>•</span>
                <span className="text-white/50">Tạo ngày {getStringValue(activePlaylist.createdAt, "Gần đây")}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  if (activePlaylistSongs.length > 0) {
                    handlePlaySong(activePlaylistSongs[0], activePlaylistSongs, playlistTitle);
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
                onClick={(e) => handleOpenDeleteModal(activePlaylist.id, playlistTitle, e)}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95"
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
                  const songImage = getStringValue(song.image) || getStringValue(song.coverUrl) || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";

                  return (
                    <div
                      key={song.id}
                      style={{ zIndex: activePlaylistSongs.length - index }}
                      onClick={() => handlePlaySong(song, activePlaylistSongs, playlistTitle)}
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
                        <Artwork
                          src={songImage} 
                          alt={getStringValue(song.title)} 
                          className="w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-lg border border-white/10" 
                        />
                        <div className="truncate">
                          <h4 className={`text-sm font-bold truncate ${isCurrent ? "text-indigo-400" : "text-white group-hover:text-indigo-300"}`}>
                            {getStringValue(song.title, "Bài hát")}
                          </h4>
                          <p className="text-xs text-white/50 truncate mt-0.5">{getArtistName(song.artist)}</p>
                        </div>
                      </div>

                      <div className="hidden sm:block sm:col-span-3 text-xs text-white/60 truncate pr-2">
                        <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-[11px]">
                          {getStringValue(song.album) || getStringValue(song.genre) || "AURAIC Original"}
                        </span>
                      </div>

                      <div className="hidden md:block md:col-span-2 text-xs text-white/40">
                        {getStringValue(song.addedAt, "Vừa xong")}
                      </div>

                      <div className="col-span-6 sm:col-span-4 md:col-span-2 flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSong(index, -1);
                          }}
                          disabled={index === 0}
                          className="hidden text-white/30 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-20 sm:block"
                          title="Đưa bài hát lên"
                          aria-label="Đưa bài hát lên"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveSong(index, 1);
                          }}
                          disabled={index === activePlaylistSongs.length - 1}
                          className="hidden text-white/30 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-20 sm:block"
                          title="Đưa bài hát xuống"
                          aria-label="Đưa bài hát xuống"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(song);
                          }}
                          className="text-white/30 hover:text-pink-500 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                          title={liked ? "Bỏ thích" : "Yêu thích"}
                        >
                          <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSongInPlaylist(activePlaylist.id, song);
                          }}
                          className="text-white/30 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                          title="Xóa khỏi Playlist này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <TrackActionMenu track={song} />

                        <span className="text-xs font-mono font-semibold text-white/50 ml-1">
                          {formatDuration(song.duration)}
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
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-3 rounded-full transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                + Thêm bài hát ngay
              </button>
            </div>
          )}
        </div>

        {showAddSongsModal && isMounted && createPortal(
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
                <p className="text-xs text-indigo-400 mt-1">Playlist: {playlistTitle}</p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none divide-y divide-white/5">
                {sourceTracks.map((song) => {
                  const isAdded = activePlaylistSongIds.some((id) => String(id) === String(song.id));
                  const songImage = getStringValue(song.image) || getStringValue(song.coverUrl) || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";

                  return (
                    <div
                      key={song.id}
                      onClick={() => handleToggleSongInPlaylist(activePlaylist.id, song)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                        isAdded ? "bg-indigo-600/15 border border-indigo-500/30" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Artwork src={songImage} alt={getStringValue(song.title)} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="truncate">
                          <h5 className="text-sm font-bold text-white truncate">{getStringValue(song.title)}</h5>
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
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg cursor-pointer"
              >
                Xong
              </button>
            </div>
          </div>,
          document.body
        )}

        {playlistToDelete && isMounted && createPortal(
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl relative text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Xóa Playlist?</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Bạn có chắc chắn muốn xóa <span className="text-white font-bold">"{playlistToDelete.name}"</span> không? Hành động này không thể hoàn tác.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPlaylistToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>,
          document.body
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
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "all" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-white/60 hover:text-white"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab("liked")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "liked" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-white/60 hover:text-white"
            }`}
          >
            Bài hát đã thích ({likedSongsList.length})
          </button>
          <button
            onClick={() => setActiveTab("playlists")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "playlists" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-white/60 hover:text-white"
            }`}
          >
            Playlist cá nhân ({playlists.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "history" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30" : "text-white/60 hover:text-white"
            }`}
          >
            Đã nghe gần đây ({listeningHistory.length})
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
            {playlists.map((pl: any) => {
              const pName = getStringValue(pl.name || pl.title, "Playlist");
              const pSongCount = pl.tracks ? pl.tracks.length : (pl.songIds ? pl.songIds.length : 0);
              const pColor = getStringValue(pl.color, "from-indigo-900/80 via-purple-900/50 to-[#0b0c10]");
              const pImage = getStringValue(pl.image, "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop");

              return (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                  className="group relative h-44 rounded-2xl overflow-hidden border border-white/10 p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:border-indigo-500/50 hover:shadow-[0_10px_30px_rgba(99,102,241,0.25)]"
                >
                  <Artwork src={pImage} alt={pName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-30 group-hover:opacity-40" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${pColor} mix-blend-multiply`}></div>
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 border border-white/20 px-2.5 py-1 rounded-full text-white/80 backdrop-blur-md">
                      {pSongCount} bài hát
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleOpenDeleteModal(pl.id, pName, e)}
                        className="w-8 h-8 rounded-full bg-black/40 hover:bg-red-500/80 text-white/60 hover:text-white border border-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110 cursor-pointer"
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
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors truncate">{pName}</h3>
                    <p className="text-xs text-white/60 mt-1 truncate">{getStringValue(pl.description, "Playlist cá nhân trên AURAIC.")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {(activeTab === "all" || activeTab === "history") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-300" /> Đã nghe gần đây ({listeningHistory.length})</h2>
            <div className="flex items-center gap-2">
              {listeningHistory.length > 0 && (
                <>
                  <button
                    onClick={() => {
                      const userId = useAuthStore.getState().user?.id;
                      if (userId) localStorage.removeItem(`auraic-history-${userId}`);
                      setListeningHistory([]);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 rounded-full border border-rose-500/20 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa lịch sử
                  </button>
                  <button onClick={() => handlePlaySong(listeningHistory[0].song, listeningHistory.map((item) => item.song), "Đã nghe gần đây")} className="flex items-center gap-2 text-xs font-bold text-black bg-white hover:bg-white/90 px-4 py-2 rounded-full transition-all shadow-lg cursor-pointer"><Play className="w-3.5 h-3.5 fill-black" /> Phát lại</button>
                </>
              )}
            </div>
          </div>
          {listeningHistory.length > 0 ? (
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-sm divide-y divide-white/[0.02]">
              {listeningHistory.slice(0, 10).map((item, index) => {
                const song = item.song;
                const isCurrent = String(currentTrack?.id) === String(song.id);
                const songImage = getStringValue(song.image) || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";
                return <div key={item.id} onClick={() => handlePlaySong(song, listeningHistory.map((historyItem) => historyItem.song), "Đã nghe gần đây")} className={`flex cursor-pointer items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.06] ${isCurrent ? "bg-indigo-500/15" : ""}`}><span className="w-5 text-xs font-mono text-white/35">{index + 1}</span><Artwork src={songImage} alt={getStringValue(song.title)} className="h-10 w-10 rounded-lg object-cover" /><div className="min-w-0 flex-1"><h4 className={`truncate text-sm font-semibold ${isCurrent ? "text-indigo-300" : "text-white"}`}>{getStringValue(song.title, "Bài hát")}</h4><p className="truncate text-xs text-white/50">{getArtistName(song.artist)} · {new Date(item.listenedAt).toLocaleDateString("vi-VN")}</p></div><span className="text-xs font-mono text-white/40">{formatDuration(song.duration)}</span></div>;
              })}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]"><Clock className="mx-auto mb-3 h-8 w-8 text-white/20" /><p className="text-white/40 text-sm">Chưa có lịch sử nghe nhạc</p><p className="mt-1 text-xs text-white/30">Các bài hát bạn nghe sẽ xuất hiện ở đây.</p></div>
          )}
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
                className="flex items-center gap-2 text-xs font-bold text-black bg-white hover:bg-white/90 px-4 py-2 rounded-full transition-all shadow-lg cursor-pointer"
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
                  const songImage = getStringValue(song.image) || getStringValue(song.coverUrl) || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";

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
                        <Artwork src={songImage} alt={getStringValue(song.title)} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        <div className="truncate">
                          <h4 className={`text-sm font-semibold truncate ${isCurrent ? "text-indigo-400" : "text-white"}`}>{getStringValue(song.title)}</h4>
                          <p className="text-xs text-white/50 truncate">{getArtistName(song.artist)}</p>
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(song);
                          }}
                          className="text-pink-500 hover:text-pink-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                          title="Bỏ thích"
                        >
                          <Heart className="w-4 h-4 fill-pink-500" />
                        </button>

                        <TrackActionMenu track={song} />

                        <span className="text-xs font-mono text-white/40 ml-1">{formatDuration(song.duration)}</span>
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

      {showCreateModal && isMounted && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-5 right-5 text-white/50 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-white">Tạo Playlist Mới</h3>
              <p className="text-xs text-white/50 mt-1">Nhập tên danh sách phát của bạn</p>
            </div>

            <form onSubmit={handleCreatePlaylistSubmit} className="space-y-4">
              <input 
                type="text" 
                placeholder="Tên playlist..." 
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-all"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white cursor-pointer">
                  Hủy
                </button>
                <button type="submit" disabled={!newPlaylistName.trim()} className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg cursor-pointer">
                  Tạo Playlist
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {playlistToDelete && isMounted && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#121216] border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Xóa Playlist?</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Bạn có chắc chắn muốn xóa <span className="text-white font-bold">"{playlistToDelete.name}"</span> không? Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPlaylistToDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
