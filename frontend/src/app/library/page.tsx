"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  AnimatePresence,
} from "framer-motion";
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
  Loader2,
  ArrowDown,
  ArrowUp,
  Music2,
} from "lucide-react";
import { usePlayerStore, Track as StoreTrack, type LocalListeningHistoryItem } from "@/store/usePlayerStore";
import { usePlaylistStore } from "@/store/usePlaylistStore";
import TrackActionMenu from "@/components/TrackActionMenu";
import { formatDuration, getListeningHistory, getSongs } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import Artwork from "@/components/Artwork";

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

const getRelativeTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 6) return `${diffHour} giờ trước`;
    if (diffHour < 24) return "Hôm nay";
    if (diffDay === 1) return "Hôm qua";
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return date.toLocaleDateString("vi-VN", { day: "numeric", month: "short" });
  } catch {
    return "Vừa xong";
  }
};

const FILTER_TABS = [
  { key: "all", label: "Tất cả", icon: Layers },
  { key: "playlists", label: "Playlist của tôi", icon: Bookmark },
  { key: "liked", label: "Bài hát đã thích", icon: Heart },
  { key: "artists", label: "Nghệ sĩ đang theo dõi", icon: Music2 },
  { key: "albums", label: "Album đã lưu", icon: Disc },
  { key: "history", label: "Đã nghe gần đây", icon: Clock },
] as const;

type TabKey = (typeof FILTER_TABS)[number]["key"];

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

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [listeningHistory, setListeningHistory] = useState<LocalListeningHistoryItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<{ id: number | string; name: string } | null>(null);

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("");
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | string | null>(null);
  const authStatus = useAuthStore((state) => state.status);
  const [librarySearch, setLibrarySearch] = useState("");

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
        const stored = JSON.parse(
          localStorage.getItem(`auraic-history-${useAuthStore.getState().user?.id}`) || "[]"
        );
        if (Array.isArray(stored)) localHistory = stored;
      } catch {
        localHistory = [];
      }
      getListeningHistory()
        .then((history) =>
          setListeningHistory([...localHistory, ...(history as LocalListeningHistoryItem[])].slice(0, 50))
        )
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
    ? activePlaylistSongIds.map((id) => {
        const catalogTrack = sourceTracks.find((song) => String(song.id) === String(id));
        const playlistTrack = (activePlaylist.tracks || []).find((t: any) => String(t.id || t) === String(id));
        if (catalogTrack) return catalogTrack;
        if (playlistTrack) return playlistTrack;
        return { id, title: `Bài hát ${id}`, image: "", audioUrl: "", artist: "Ca sĩ chưa xác định", duration: null } as any;
      })
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

  const filteredPlaylists = playlists.filter((pl: any) => {
    if (!librarySearch) return true;
    const name = getStringValue(pl.name || pl.title, "").toLowerCase();
    return name.includes(librarySearch.toLowerCase());
  });

  const filteredHistory = listeningHistory.filter((item) => {
    if (!librarySearch) return true;
    const title = getStringValue(item.song.title, "").toLowerCase();
    const artist = getArtistName(item.song.artist).toLowerCase();
    return title.includes(librarySearch.toLowerCase()) || artist.includes(librarySearch.toLowerCase());
  });

  const activePlaylistTitle = activePlaylist ? getStringValue(activePlaylist.title, "Playlist") : "";
  const activePlaylistImage = activePlaylist
    ? getStringValue(activePlaylist.coverImage) ||
      (activePlaylistSongs[0]?.image as string | undefined) ||
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop"
    : "";

  const latestHistoryItem = filteredHistory[0];
  const latestSong = latestHistoryItem?.song;
  const latestImage = latestSong
    ? getStringValue(latestSong.image) || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop"
    : "";
  const latestTitle = latestSong ? getStringValue(latestSong.title, "Bài hát") : "Bài hát";
  const latestArtist = latestSong ? getArtistName(latestSong.artist) : "Ca sĩ chưa xác định";
  const latestTime = latestHistoryItem ? getRelativeTime(latestHistoryItem.listenedAt) : "";
  const isLatestCurrent = latestSong ? String(currentTrack?.id) === String(latestSong.id) : false;

  if (loadingSongs) {
    return (
      <div className="flex items-center justify-center h-full text-white/50 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <span className="text-sm font-medium">Đang tải Thư viện...</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-none pb-28 text-white">
      {/* Header Section */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1"
            >
              <Bookmark className="w-4 h-4" /> Space của riêng bạn
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="text-3xl sm:text-4xl font-black text-white tracking-tight"
            >
              Thư Viện Âm Nhạc
            </motion.h1>
          </div>
        </div>

        {/* Capsule Filter Pills + Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <div className="relative flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
            <AnimatePresence mode="popLayout">
              {FILTER_TABS.map((tab) => (
                <motion.button
                  key={tab.key}
                  layoutId="active-library-tab"
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === tab.key ? "text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="library-tab-pill"
                      className="absolute inset-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30"
                      transition={{ type: "spring", damping: 24, stiffness: 180 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.key === "liked" && likedSongsList.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        activeTab === "liked" ? "bg-white/20 text-white" : "bg-white/10 text-white/60"
                      }`}>
                        {likedSongsList.length}
                      </span>
                    )}
                    {tab.key === "playlists" && playlists.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        activeTab === "playlists" ? "bg-white/20 text-white" : "bg-white/10 text-white/60"
                      }`}>
                        {playlists.length}
                      </span>
                    )}
                    {tab.key === "history" && listeningHistory.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        activeTab === "history" ? "bg-white/20 text-white" : "bg-white/10 text-white/60"
                      }`}>
                        {listeningHistory.length}
                      </span>
                    )}
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Tìm trong thư viện..."
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
            />
          </div>
        </motion.div>
      </div>

      {activePlaylist ? (
        <div className="min-h-full overflow-y-auto scrollbar-none pb-28 text-white relative">
            {/* Dynamic blurred background from playlist image */}
            <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden pointer-events-none">
              <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePlaylistImage}
                  alt=""
                  className="w-full h-full object-cover opacity-50 blur-[100px] scale-125"
                  style={{ filter: "blur(100px) saturate(1.5)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#09090b]" />
              </div>
            </div>

            <div className="relative z-10 p-6 sm:p-8 space-y-6">
              {/* Back button */}
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  setSelectedPlaylistId(null);
                  setIsShuffleActive(false);
                }}
                className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-full text-white border border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại Thư viện
              </motion.button>

              {/* Playlist Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col md:flex-row items-start md:items-end gap-6 sm:gap-8 pt-4"
              >
                <div className="relative group flex-shrink-0 mx-auto md:mx-0">
                  <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-r from-indigo-500 to-purple-600 opacity-40 blur-2xl group-hover:opacity-70 transition-all duration-500" />
                  <Artwork
                    src={activePlaylistImage}
                    alt={activePlaylistTitle}
                    className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 object-cover rounded-3xl shadow-2xl border border-white/20"
                  />
                </div>

                <div className="space-y-4 flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-indigo-300 uppercase tracking-widest">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Danh Sách Phát Cá Nhân
                  </div>

                  <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-lg">
                    {activePlaylistTitle}
                  </h1>

                  <p className="text-sm text-white/70 max-w-2xl leading-relaxed mx-auto md:mx-0">
                    {getStringValue(activePlaylist.description, "Giai điệu tuyển chọn dành riêng cho trải nghiệm âm nhạc của bạn.")}
                  </p>

                  <div className="flex items-center justify-center md:justify-start flex-wrap gap-4 text-xs font-semibold text-white/80 pt-2 border-t border-white/10">
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
              </motion.div>

              {/* Action Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.03] p-4 sm:p-5 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (activePlaylistSongs.length > 0) {
                        handlePlaySong(activePlaylistSongs[0], activePlaylistSongs, activePlaylistTitle);
                      }
                    }}
                    disabled={activePlaylistSongs.length === 0}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 disabled:opacity-40 text-black flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all cursor-pointer"
                  >
                    <Play className="w-6 h-6 fill-white text-white ml-1" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleShufflePlay}
                    disabled={activePlaylistSongs.length === 0}
                    className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer disabled:opacity-40 ${
                      isShuffleActive
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                        : "bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10"
                    }`}
                    title={isShuffleActive ? "Đang bật phát ngẫu nhiên" : "Tắt phát ngẫu nhiên"}
                  >
                    <Shuffle className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddSongsModal(true)}
                    className="flex items-center gap-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Thêm bài hát
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleOpenDeleteModal(activePlaylist.id, activePlaylistTitle, e)}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
                    title="Xóa Playlist này"
                  >
                    <Trash2 className="w-4 h-4" /> Xóa Playlist
                  </motion.button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      placeholder="Tìm bài hát trong playlist..."
                      value={playlistSearchQuery}
                      onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
                    />
                  </div>
                </div>
              </motion.div>

              {activePlaylistSongs.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl relative overflow-hidden"
                >
                  <div className="grid grid-cols-12 text-xs font-black text-white/40 px-6 py-4 border-b border-white/10 uppercase tracking-wider">
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
                        <motion.div
                          key={song.id}
                          style={{ zIndex: activePlaylistSongs.length - index }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handlePlaySong(song, activePlaylistSongs, activePlaylistTitle)}
                          className={`grid grid-cols-12 items-center px-6 py-3.5 transition-all duration-200 cursor-pointer group relative ${
                            index === activePlaylistSongs.length - 1 ? "rounded-b-3xl" : ""
                          } ${
                            isCurrent
                              ? "bg-indigo-500/15 border-l-4 border-indigo-500 text-white"
                              : "hover:bg-white/[0.05] border-l-4 border-transparent"
                          }`}
                        >
                          <div className="col-span-1 text-xs font-mono font-bold text-white/40">
                            {isCurrent && isPlaying ? (
                              <div className="flex items-center gap-0.5">
                                {[0, 1, 2].map((i) => (
                                  <motion.span
                                    key={i}
                                    className="w-[3px] rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-400"
                                    animate={{ height: ["30%", "100%", "40%", "90%", "50%"] }}
                                    transition={{ duration: 0.6 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <>
                                <span className={isCurrent ? "text-indigo-400" : "group-hover:hidden"}>
                                  {index + 1 < 10 ? `0${index + 1}` : index + 1}
                                </span>
                                <Play className="w-4 h-4 text-white fill-white hidden group-hover:block" />
                              </>
                            )}
                          </div>

                          <div className="col-span-5 sm:col-span-4 flex items-center gap-3.5 min-w-0 pr-2">
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10">
                              <Artwork
                                src={songImage}
                                alt={getStringValue(song.title)}
                                className="h-full w-full object-cover"
                              />
                              <motion.div
                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0"
                                initial={false}
                                whileHover={{ opacity: 1 }}
                              >
                                <Play className="h-4 w-4 fill-white text-white" />
                              </motion.div>
                            </div>
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

                          <div className="col-span-6 sm:col-span-4 md:col-span-2 flex items-center justify-end gap-1">
                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveSong(index, -1);
                              }}
                              disabled={index === 0}
                              className="hidden text-white/30 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-20 sm:block p-1"
                              title="Đưa bài hát lên"
                              aria-label="Đưa bài hát lên"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveSong(index, 1);
                              }}
                              disabled={index === activePlaylistSongs.length - 1}
                              className="hidden text-white/30 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-20 sm:block p-1"
                              title="Đưa bài hát xuống"
                              aria-label="Đưa bài hát xuống"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLike(song);
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${liked ? "text-pink-500" : "text-white/30 hover:text-pink-500 hover:bg-white/5"}`}
                              title={liked ? "Bỏ thích" : "Yêu thích"}
                            >
                              <Heart className={`w-4 h-4 ${liked ? "fill-pink-500" : ""}`} />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSongInPlaylist(activePlaylist.id, song);
                              }}
                              className="text-white/30 hover:text-red-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                              title="Xóa khỏi Playlist này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>

                            <TrackActionMenu track={song} />

                            <span className="text-xs font-mono font-semibold text-white/50 ml-1">
                              {formatDuration(song.duration)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.01] backdrop-blur-xl space-y-4"
                >
                  <Disc className="w-12 h-12 text-white/20 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Chưa có bài hát nào trong Playlist này</h3>
                    <p className="text-xs text-white/40">Hãy tìm kiếm hoặc thêm những bài hát yêu thích của bạn vào đây.</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddSongsModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-6 py-3 rounded-full transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    + Thêm bài hát ngay
                  </motion.button>
                </motion.div>
              )}
            </div>

            {showAddSongsModal && isMounted && createPortal(
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                onClick={() => setShowAddSongsModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#121216] border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col space-y-5 shadow-2xl relative"
                >
                  <button
                    onClick={() => setShowAddSongsModal(false)}
                    className="absolute top-5 right-5 text-white/50 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div>
                    <h3 className="text-xl font-bold text-white">Thêm bài hát vào Playlist</h3>
                    <p className="text-xs text-indigo-400 mt-1">Playlist: {activePlaylistTitle}</p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none divide-y divide-white/5">
                    {sourceTracks.map((song) => {
                      const isAdded = activePlaylistSongIds.some((id) => String(id) === String(song.id));
                      const songImage = getStringValue(song.image) || getStringValue(song.coverUrl) || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";

                      return (
                        <motion.div
                          key={song.id}
                          whileHover={{ x: 4 }}
                          onClick={() => handleToggleSongInPlaylist(activePlaylist.id, song)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                            isAdded ? "bg-indigo-600/15 border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Artwork src={songImage} alt={getStringValue(song.title)} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                            <div className="truncate">
                              <h5 className="text-sm font-bold text-white truncate">{getStringValue(song.title)}</h5>
                              <p className="text-xs text-white/50 truncate">{getArtistName(song.artist)}</p>
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
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
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddSongsModal(false)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg cursor-pointer"
                  >
                    Xong
                  </motion.button>
                </motion.div>
              </motion.div>,
              document.body
            )}

            {playlistToDelete && isMounted && createPortal(
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                onClick={() => setPlaylistToDelete(null)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#121216] border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl relative text-center"
                >
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
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setPlaylistToDelete(null)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                    >
                      Hủy
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={handleConfirmDelete}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                    >
                      Xóa ngay
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>,
              document.body
            )}
          </div>
        ) : null}

        {/* Liked Songs Hero Tile */}

      {/* Liked Songs Hero Tile */}
      {(activeTab === "all" || activeTab === "liked") && (
        <motion.div
          layout
          className="px-6 sm:px-8 mb-8"
        >
          <div className="relative group">
            {/* Gradient Aura Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 rounded-[2rem] opacity-30 blur-2xl group-hover:opacity-50 transition-all duration-700" />
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-500 rounded-[2rem] opacity-20 blur-xl group-hover:opacity-30 transition-all duration-500" />

            <div className="relative bg-gradient-to-br from-[#1a0b2e] via-[#0f172a] to-[#0c1220] border border-white/10 rounded-[1.8rem] p-6 sm:p-8 overflow-hidden">
              {/* Animated shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[2s] ease-in-out" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                {/* 3D Heart Icon */}
                <div className="relative shrink-0">
                  <div className="absolute -inset-4 bg-pink-500/30 rounded-full blur-2xl animate-pulse-glow" />
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-[0_0_40px_rgba(236,72,153,0.5)] border border-pink-400/30">
                    <Heart className="w-10 h-10 sm:w-12 sm:h-12 fill-white text-white drop-shadow-lg" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-pink-500/20 text-pink-400 border border-pink-500/30 px-3 py-1 rounded-full backdrop-blur-md">
                      Đã thích
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Bài hát đã thích
                  </h2>

                  <p className="text-sm text-white/60">
                    {likedSongsList.length} bài hát trong thư viện của bạn
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => likedSongsList.length > 0 && handlePlaySong(likedSongsList[0], likedSongsList, "Bài hát đã thích")}
                    disabled={likedSongsList.length === 0}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 disabled:opacity-40 text-white flex items-center justify-center shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all cursor-pointer"
                  >
                    <Play className="w-6 h-6 fill-white ml-1" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bento Grid Section: Create Playlist + Personal Playlists */}
      {(activeTab === "all" || activeTab === "playlists") && (
        <motion.section
          layout
          className="px-6 sm:px-8 mb-10"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Danh sách phát cá nhân
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-2 rounded-full border border-indigo-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo Playlist
            </motion.button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Create Playlist Card */}
            <motion.button
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreateModal(true)}
              className="aspect-square rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/40 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-all border border-white/10 group-hover:border-indigo-500/30 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                <Plus className="w-7 h-7 text-white/40 group-hover:text-indigo-400 transition-colors" />
              </div>
              <span className="text-xs font-bold text-white/50 group-hover:text-white/80 transition-colors">Tạo Playlist</span>
            </motion.button>

            {/* Playlist Cards */}
            {filteredPlaylists.map((pl: any, index: number) => {
              const pName = getStringValue(pl.title, "Playlist");
              const pSongCount = pl.tracks ? pl.tracks.length : (pl.songIds ? pl.songIds.length : 0);
              const firstTrackImage = pl.tracks?.[0]?.image as string | undefined;
              const catalogFirstImage = pl.tracks && pl.tracks[0]
                ? (systemSongs.find((s: any) => String(s.id) === String(pl.tracks[0].id))?.image as string | undefined)
                : undefined;
              const pImage =
                getStringValue(pl.coverImage) ||
                firstTrackImage ||
                catalogFirstImage ||
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";
              const pColor = getStringValue(pl.color, "from-indigo-900/80 via-purple-900/50 to-[#0b0c10]");

              return (
                <motion.div
                  key={pl.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -6 }}
                  onClick={() => setSelectedPlaylistId(pl.id)}
                  className="group relative aspect-square rounded-3xl overflow-hidden border border-white/10 cursor-pointer"
                >
                  {/* Artwork background */}
                  <div className="absolute inset-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pImage}
                      alt={pName}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${pColor} mix-blend-multiply opacity-60`} />
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-all" />
                  </div>

                  {/* Hover play button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileHover={{ scale: 1.1 }}
                      className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center shadow-2xl"
                    >
                      <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                    </motion.div>
                  </div>

                  {/* Delete button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleOpenDeleteModal(pl.id, pName, e)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-red-500/80 text-white/60 hover:text-white border border-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10"
                    title="Xóa Playlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-base font-bold text-white truncate group-hover:text-indigo-200 transition-colors">{pName}</h3>
                    <p className="text-xs text-white/60 mt-0.5">{pSongCount} bài hát</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Recently Played - List View */}
      {(activeTab === "all" || activeTab === "history") && (
        <motion.section
          layout
          className="px-6 sm:px-8 mb-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-300" /> Đã nghe gần đây
              {filteredHistory.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                  {filteredHistory.length}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {filteredHistory.length > 0 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const userId = useAuthStore.getState().user?.id;
                      if (userId) localStorage.removeItem(`auraic-history-${userId}`);
                      setListeningHistory([]);
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 rounded-full border border-rose-500/20 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa lịch sử
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePlaySong(filteredHistory[0].song, filteredHistory.map((item) => item.song), "Đã nghe gần đây")}
                    className="flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 px-4 py-2 rounded-full transition-all shadow-lg shadow-purple-500/30 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" /> Phát lại
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {filteredHistory.length > 0 ? (
            <div className="space-y-6">
              {/* Hero Track Spotlight */}
              {latestSong && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  onClick={() => handlePlaySong(latestSong, filteredHistory.map((h) => h.song), "Đã nghe gần đây")}
                  className="group relative cursor-pointer"
                >
                  {/* Ambient blurred background */}
                  <div className="absolute -inset-4 rounded-[2.5rem] overflow-hidden pointer-events-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={latestImage}
                      alt=""
                      className="w-full h-full object-cover opacity-30 blur-[80px] scale-125"
                      style={{ filter: "blur(80px) saturate(1.4)" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#09090b]" />
                  </div>

                  <div className="relative bg-white/[0.04] border border-white/10 rounded-[2rem] p-5 sm:p-7 backdrop-blur-xl overflow-hidden">
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[2s] ease-in-out" />

                    <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-7 relative z-10">
                      {/* Large artwork */}
                      <div className="relative shrink-0">
                        <div className="absolute -inset-2 bg-cyan-500/20 rounded-3xl blur-2xl group-hover:bg-cyan-500/30 transition-all" />
                         <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img
                            src={latestImage}
                            alt={latestTitle}
                            className="w-full h-full object-cover"
                          />
                          {isLatestCurrent && isPlaying && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="flex items-end gap-1 h-6">
                                {[0, 1, 2].map((i) => (
                                  <motion.span
                                    key={i}
                                    className="w-[3px] rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-400"
                                    animate={{ height: ["30%", "100%", "40%", "90%", "50%"] }}
                                    transition={{ duration: 0.6 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full">
                            Vừa nghe
                          </span>
                          <span className="text-[10px] font-semibold text-white/40">{latestTime}</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white truncate">{latestTitle}</h3>
                        <p className="text-sm text-white/60 truncate">{latestArtist}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(latestSong);
                          }}
                          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-pink-400 transition-all"
                          title={isLiked(latestSong.id) ? "Bỏ thích" : "Yêu thích"}
                        >
                          <Heart className={`w-4 h-4 ${isLiked(latestSong.id) ? "fill-pink-500 text-pink-500" : ""}`} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlaySong(latestSong, filteredHistory.map((h) => h.song), "Đã nghe gần đây");
                          }}
                          className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
                        >
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* History List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                {filteredHistory.slice(1).map((item, index) => {
                  const song = item.song;
                  const isCurrent = String(currentTrack?.id) === String(song.id);
                  const liked = isLiked(song.id);
                  const songImage = getStringValue(song.image) || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";
                  const listenedAt = getRelativeTime(item.listenedAt);

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index + 1) * 0.03 }}
                      whileHover={{ x: 4 }}
                      onClick={() => handlePlaySong(song, filteredHistory.map((h) => h.song), "Đã nghe gần đây")}
                      className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl cursor-pointer transition-all border ${
                        isCurrent
                          ? "bg-indigo-500/15 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                          : "bg-white/[0.03] border-white/5 hover:bg-white/[0.07] hover:border-white/10"
                      }`}
                    >
                      {/* Index / Equalizer */}
                      <div className="w-6 flex justify-center shrink-0">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end gap-0.5 h-4">
                            {[0, 1, 2].map((i) => (
                              <motion.span
                                key={i}
                                className="w-[3px] rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-400"
                                animate={{ height: ["30%", "100%", "40%", "90%", "50%"] }}
                                transition={{ duration: 0.6 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                              />
                            ))}
                          </div>
                        ) : (
                          <>
                            <span className={`text-xs font-mono font-bold transition-colors ${isCurrent ? "text-indigo-400" : "text-white/30 group-hover:text-white/60"}`}>
                              {index + 2 < 10 ? `0${index + 2}` : index + 2}
                            </span>
                            <Play className="w-3.5 h-3.5 text-white fill-white hidden group-hover:block ml-0.5" />
                          </>
                        )}
                      </div>

                      {/* Artwork */}
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={songImage}
                          alt={getStringValue(song.title)}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="h-4 w-4 fill-white text-white" />
                        </div>
                      </div>

                      {/* Title + Artist */}
                      <div className="min-w-0 flex-1">
                        <h4 className={`truncate text-sm font-semibold ${isCurrent ? "text-indigo-300" : "text-white"}`}>
                          {getStringValue(song.title, "Bài hát")}
                        </h4>
                        <p className="truncate text-xs text-white/50">{getArtistName(song.artist)}</p>
                      </div>

                      {/* Time */}
                      <span className="text-[11px] font-medium text-white/40 shrink-0 hidden sm:block">
                        {listenedAt}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(song);
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${liked ? "text-pink-500" : "text-white/40 hover:text-pink-400 hover:bg-white/5"}`}
                          title={liked ? "Bỏ thích" : "Yêu thích"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-pink-500" : ""}`} />
                        </motion.button>

                        <span className="text-xs font-mono text-white/40 ml-1">{formatDuration(song.duration)}</span>

                        <TrackActionMenu track={song} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl bg-white/[0.01] backdrop-blur-xl">
              <Clock className="mx-auto mb-3 h-10 w-10 text-white/20" />
              <p className="text-white/40 text-sm">Chưa có lịch sử nghe nhạc</p>
              <p className="mt-1 text-xs text-white/30">Các bài hát bạn nghe sẽ xuất hiện ở đây.</p>
            </div>
          )}
        </motion.section>
      )}

      {/* Liked Songs List (when on liked tab) */}
      {activeTab === "liked" && (
        <motion.section
          layout
          className="px-6 sm:px-8 mb-10"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" /> Bài hát đã thích ({likedSongsList.length})
            </h2>
            {likedSongsList.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlaySong(likedSongsList[0], likedSongsList, "Bài hát đã thích")}
                className="flex items-center gap-2 text-xs font-bold text-black bg-white hover:bg-white/90 px-4 py-2 rounded-full transition-all shadow-lg cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black" /> Phát tất cả
              </motion.button>
            )}
          </div>

          {likedSongsList.length > 0 ? (
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-xl relative overflow-hidden">
              <div className="grid grid-cols-12 text-xs font-semibold text-white/40 px-6 py-3.5 border-b border-white/5 uppercase tracking-wider rounded-t-3xl">
                <div className="col-span-1">#</div>
                <div className="col-span-8">Bài hát</div>
                <div className="col-span-3 text-right">Tùy chọn</div>
              </div>

              <div className="divide-y divide-white/[0.03]">
                {likedSongsList.map((song: Track, index: number) => {
                  const isCurrent = String(currentTrack?.id) === String(song.id);
                  const songImage = getStringValue(song.image) || getStringValue(song.coverUrl) || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";

                  return (
                    <motion.div
                      key={song.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => handlePlaySong(song, likedSongsList, "Bài hát đã thích")}
                      className={`grid grid-cols-12 items-center px-6 py-3.5 transition-all duration-200 cursor-pointer group relative ${
                        index === likedSongsList.length - 1 ? "rounded-b-3xl" : ""
                      } ${
                        isCurrent
                          ? "bg-indigo-500/15 border-l-4 border-indigo-500"
                          : "hover:bg-white/[0.06] border-l-4 border-transparent"
                      }`}
                    >
                      <div className="col-span-1 text-xs font-mono font-bold text-white/40">
                        {isCurrent && isPlaying ? (
                          <div className="flex items-end gap-0.5 h-4">
                            {[0, 1, 2].map((i) => (
                              <motion.span
                                key={i}
                                className="w-[3px] rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-400"
                                animate={{ height: ["30%", "100%", "40%", "90%", "50%"] }}
                                transition={{ duration: 0.6 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className={isCurrent ? "text-indigo-400" : "group-hover:hidden"}>
                            {index + 1 < 10 ? `0${index + 1}` : index + 1}
                          </span>
                        )}
                        {!isCurrent && !isCurrent && (
                          <Play className="w-4 h-4 text-white fill-white hidden group-hover:block" />
                        )}
                      </div>

                      <div className="col-span-8 flex items-center gap-3.5 min-w-0">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10">
                          <Artwork src={songImage} alt={getStringValue(song.title)} className="h-full w-full object-cover" />
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0"
                            initial={false}
                            whileHover={{ opacity: 1 }}
                          >
                            <Play className="h-3.5 w-3.5 fill-white text-white" />
                          </motion.div>
                        </div>
                        <div className="truncate">
                          <h4 className={`text-sm font-semibold truncate ${isCurrent ? "text-indigo-400" : "text-white"}`}>
                            {getStringValue(song.title)}
                          </h4>
                          <p className="text-xs text-white/50 truncate">{getArtistName(song.artist)}</p>
                        </div>
                      </div>

                      <div className="col-span-3 flex items-center justify-end gap-1">
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(song);
                          }}
                          className="text-pink-500 hover:text-pink-400 transition-colors p-1.5 hover:bg-white/5 rounded-lg"
                          title="Bỏ thích"
                        >
                          <Heart className="w-4 h-4 fill-pink-500" />
                        </motion.button>

                        <TrackActionMenu track={song} />

                        <span className="text-xs font-mono text-white/40 ml-1">{formatDuration(song.duration)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl bg-white/[0.01] backdrop-blur-xl">
              <Heart className="mx-auto mb-3 h-10 w-10 text-white/20" />
              <p className="text-white/40 text-sm">Chưa có bài hát nào trong danh sách yêu thích</p>
              <p className="mt-1 text-xs text-white/30">Nhấn vào trái tim bên cạnh bài hát để thêm vào đây.</p>
            </div>
          )}
        </motion.section>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && isMounted && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121216] border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-6 shadow-2xl relative"
          >
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white cursor-pointer"
                >
                  Hủy
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg cursor-pointer disabled:opacity-40"
                >
                  Tạo Playlist
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {playlistToDelete && isMounted && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setPlaylistToDelete(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#121216] border border-white/10 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl relative text-center"
          >
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setPlaylistToDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                Hủy
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                Xóa ngay
              </motion.button>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}
