"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  Play, 
  Heart, 
  Music, 
  UserCheck, 
  Disc, 
  Layers, 
  Sparkles,
  X,
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { usePlayerStore, Track as StoreTrack } from "@/store/usePlayerStore";
import TrackActionMenu from "@/components/TrackActionMenu";
import { formatDuration } from "@/lib/api";

export type Track = StoreTrack & {
  addedAt?: string;
  album?: string;
  genre?: string;
};

// Dữ liệu giả lập hệ thống
const SEARCH_DATABASE = {
  songs: [
    { 
      id: 1, 
      title: "Chúng Ta Của Tương Lai", 
      artist: "Sơn Tùng M-TP", 
      album: "Chúng Ta Của Tương Lai (Single)",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop", 
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      genre: "Pop / R&B",
      duration: "03:38"
    },
    { 
      id: 2, 
      title: "Nấu Ăn Cho Em", 
      artist: "Đen Vâu ft. PiaLinh", 
      album: "Nấu Ăn Cho Em (Single)",
      image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop", 
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
      genre: "Hip-Hop / Rap",
      duration: "04:12"
    },
    { 
      id: 3, 
      title: "Chạy Ngay Đi", 
      artist: "Sơn Tùng M-TP", 
      album: "Chạy Ngay Đi",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop", 
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      genre: "Hip-Hop / Trap",
      duration: "04:05"
    },
    { 
      id: 4, 
      title: "Waiting For You", 
      artist: "MONO", 
      album: "22",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop", 
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      genre: "Synth-Pop",
      duration: "03:25"
    },
    { 
      id: 5, 
      title: "Chìm Sâu", 
      artist: "RPT MCK ft. Trung Trần", 
      album: "99%",
      image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop", 
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      genre: "R&B / Soul",
      duration: "02:58"
    },
    { 
      id: 6, 
      title: "See Tình", 
      artist: "Hoàng Thùy Linh", 
      album: "LINK",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop", 
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      genre: "Dance Pop",
      duration: "03:10"
    }
  ],
  artists: [
    {
      id: "art-1",
      name: "Sơn Tùng M-TP",
      followers: "2.4M",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop",
      role: "Nghệ sĩ chính"
    },
    {
      id: "art-2",
      name: "Đen Vâu",
      followers: "1.9M",
      image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop",
      role: "Nghệ sĩ chính"
    },
    {
      id: "art-3",
      name: "MONO",
      followers: "850K",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop",
      role: "Nghệ sĩ chính"
    },
    {
      id: "art-4",
      name: "Hoàng Thùy Linh",
      followers: "1.2M",
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop",
      role: "Nghệ sĩ chính"
    }
  ],
  albums: [
    {
      id: "alb-1",
      title: "99%",
      artist: "RPT MCK",
      year: "2023",
      tracksCount: 16,
      image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "alb-2",
      title: "LINK",
      artist: "Hoàng Thùy Linh",
      year: "2022",
      tracksCount: 10,
      image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "alb-3",
      title: "22",
      artist: "MONO",
      year: "2022",
      tracksCount: 11,
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop"
    }
  ],
  playlists: [
    {
      id: "pl-1",
      name: "V-Pop Hits 2026",
      owner: "AURAIC Editorial",
      songCount: 50,
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "pl-2",
      name: "Giai Điệu Chill Đêm Khuya",
      owner: "AURAIC Editorial",
      songCount: 35,
      image: "https://images.unsplash.com/photo-1493225457124-a1a2a5f52860?q=80&w=500&auto=format&fit=crop"
    },
    {
      id: "pl-3",
      name: "Indie Việt Bắt Tai",
      owner: "AURAIC Editorial",
      songCount: 42,
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=500&auto=format&fit=crop"
    }
  ]
};

const SUGGESTED_TAGS = [
  "Sơn Tùng M-TP", "Đen Vâu", "MONO", "Lo-fi Chill", "Rap Việt", "Pop Ballad"
];

type SearchTab = "all" | "songs" | "artists" | "albums" | "playlists";

type TopResult = 
  | { type: "song"; data: typeof SEARCH_DATABASE.songs[0] }
  | { type: "artist"; data: typeof SEARCH_DATABASE.artists[0] }
  | { type: "album"; data: typeof SEARCH_DATABASE.albums[0] }
  | { type: "playlist"; data: typeof SEARCH_DATABASE.playlists[0] }
  | null;

export default function SearchPage() {
  const { likedIds, currentTrack, toggleLike, playTrack } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");

  const isLiked = (id: number | string) => {
    return (likedIds || []).some((likedId) => String(likedId) === String(id));
  };

  // Logic lọc dữ liệu theo từ khóa
  const filteredResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return { songs: [], artists: [], albums: [], playlists: [], topResult: null as TopResult };
    }

    const songs = SEARCH_DATABASE.songs.filter(
      (s) => s.title.toLowerCase().includes(query) || s.artist.toLowerCase().includes(query) || s.genre.toLowerCase().includes(query)
    );

    const artists = SEARCH_DATABASE.artists.filter(
      (a) => a.name.toLowerCase().includes(query)
    );

    const albums = SEARCH_DATABASE.albums.filter(
      (al) => al.title.toLowerCase().includes(query) || al.artist.toLowerCase().includes(query)
    );

    const playlists = SEARCH_DATABASE.playlists.filter(
      (p) => p.name.toLowerCase().includes(query) || p.owner.toLowerCase().includes(query)
    );

    let topResult: TopResult = null;
    if (artists.length > 0 && artists[0].name.toLowerCase() === query) {
      topResult = { type: "artist", data: artists[0] };
    } else if (songs.length > 0) {
      topResult = { type: "song", data: songs[0] };
    } else if (artists.length > 0) {
      topResult = { type: "artist", data: artists[0] };
    } else if (albums.length > 0) {
      topResult = { type: "album", data: albums[0] };
    } else if (playlists.length > 0) {
      topResult = { type: "playlist", data: playlists[0] };
    }

    return { songs, artists, albums, playlists, topResult };
  }, [searchQuery]);

  const totalResultsCount = 
    filteredResults.songs.length + 
    filteredResults.artists.length + 
    filteredResults.albums.length + 
    filteredResults.playlists.length;

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto scrollbar-none pb-28 text-white bg-[#09090b]">
      {/* Ô TÌM KIẾM CHÍNH */}
      <div className="space-y-4">
        <div className="relative max-w-2xl">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Bạn muốn nghe bài hát, nghệ sĩ hay album nào?..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 py-4 text-base text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-2xl backdrop-blur-md"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 rounded-full transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* GỢI Ý TÌM KIẾM NHANH KHI RỖNG */}
        {!searchQuery && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-white/40 flex items-center gap-1 mr-2">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Xu hướng:
            </span>
            {SUGGESTED_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 px-3.5 py-1.5 rounded-full transition-all cursor-pointer hover:border-indigo-500/40"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* THANH TAB BỘ LỌC (Chỉ hiển thị khi có từ khóa) */}
      {searchQuery && (
        <div className="flex items-center border-b border-white/10 gap-2 pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "all"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab("songs")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "songs"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            Bài hát ({filteredResults.songs.length})
          </button>
          <button
            onClick={() => setActiveTab("artists")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "artists"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            Nghệ sĩ ({filteredResults.artists.length})
          </button>
          <button
            onClick={() => setActiveTab("albums")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "albums"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            Album ({filteredResults.albums.length})
          </button>
          <button
            onClick={() => setActiveTab("playlists")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "playlists"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
          >
            Playlist ({filteredResults.playlists.length})
          </button>
        </div>
      )}

      {/* HIỂN THỊ KẾT QUẢ TÌM KIẾM */}
      {searchQuery ? (
        totalResultsCount > 0 ? (
          <div className="space-y-10">
            {/* TAB TẤT CẢ (ALL) */}
            {activeTab === "all" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* KẾT QUẢ PHÙ HỢP NHẤT */}
                  {filteredResults.topResult && (
                    <div className="lg:col-span-5 space-y-3">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" /> Kết quả phù hợp nhất
                      </h3>
                      <div className="bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 p-6 rounded-3xl transition-all group relative overflow-hidden backdrop-blur-xl h-[220px] flex flex-col justify-between">
                        {filteredResults.topResult.type === "song" && (
                          <>
                            <div className="flex items-center gap-4 z-10">
                              <img
                                src={filteredResults.topResult.data.image}
                                alt={filteredResults.topResult.data.title}
                                className="w-20 h-20 rounded-2xl object-cover shadow-2xl border border-white/10"
                              />
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                                  Bài hát
                                </span>
                                <h2 className="text-xl font-bold text-white truncate mt-2">
                                  {filteredResults.topResult.data.title}
                                </h2>
                                <p className="text-xs text-white/50 truncate mt-0.5">
                                  {filteredResults.topResult.data.artist}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (filteredResults.topResult?.type === "song") {
                                  playTrack(filteredResults.topResult.data as any, filteredResults.songs as any, "Tìm kiếm");
                                }
                              }}
                              className="self-end w-12 h-12 rounded-full bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 transition-all transform group-hover:scale-105 active:scale-95 cursor-pointer z-10"
                            >
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </button>
                          </>
                        )}

                        {filteredResults.topResult.type === "artist" && (
                          <>
                            <div className="flex items-center gap-4 z-10">
                              <img
                                src={filteredResults.topResult.data.image}
                                alt={filteredResults.topResult.data.name}
                                className="w-20 h-20 rounded-full object-cover shadow-2xl border border-white/10"
                              />
                              <div className="min-w-0">
                                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                                  Nghệ sĩ
                                </span>
                                <h2 className="text-xl font-bold text-white truncate mt-2">
                                  {filteredResults.topResult.data.name}
                                </h2>
                                <p className="text-xs text-white/50 truncate mt-0.5">
                                  {filteredResults.topResult.data.followers} người theo dõi
                                </p>
                              </div>
                            </div>
                            <div className="self-end text-xs font-bold text-indigo-400 flex items-center gap-1 z-10">
                              Xem hồ sơ <ChevronRight className="w-4 h-4" />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* BÀI HÁT TOP TÌM KIẾM */}
                  {filteredResults.songs.length > 0 && (
                    <div className={`space-y-3 ${filteredResults.topResult ? "lg:col-span-7" : "lg:col-span-12"}`}>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Music className="w-4 h-4 text-indigo-400" /> Bài hát
                      </h3>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl divide-y divide-white/[0.03]">
                        {filteredResults.songs.slice(0, 4).map((song) => {
                          const isCurrent = String(currentTrack?.id) === String(song.id);
                          const liked = isLiked(song.id);

                          return (
                            <div
                              key={song.id}
                              onClick={() => playTrack(song as any, filteredResults.songs as any, "Tìm kiếm")}
                              className={`flex items-center justify-between p-3.5 transition-all cursor-pointer rounded-xl group ${
                                isCurrent ? "bg-indigo-500/15 text-indigo-400" : "hover:bg-white/5"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={song.image}
                                  alt={song.title}
                                  className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                                />
                                <div className="truncate">
                                  <h4 className={`text-sm font-bold truncate ${isCurrent ? "text-indigo-400" : "text-white"}`}>
                                    {song.title}
                                  </h4>
                                  <p className="text-xs text-white/50 truncate mt-0.5">{song.artist}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLike(song);
                                  }}
                                  className="text-white/30 hover:text-pink-500 p-1.5 transition-colors"
                                >
                                  <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
                                </button>
                                <TrackActionMenu track={song as any} />
                                <span className="text-xs font-mono text-white/40 ml-1">{formatDuration(song.duration)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* NGHỆ SĨ */}
                {filteredResults.artists.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-purple-400" /> Nghệ sĩ
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {filteredResults.artists.map((artist) => (
                        <div
                          key={artist.id}
                          className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 p-4 rounded-2xl flex flex-col items-center text-center space-y-3 cursor-pointer transition-all hover:scale-105"
                        >
                          <img
                            src={artist.image}
                            alt={artist.name}
                            className="w-24 h-24 rounded-full object-cover shadow-lg border border-white/10"
                          />
                          <div className="w-full">
                            <h4 className="text-sm font-bold text-white truncate">{artist.name}</h4>
                            <p className="text-[11px] text-white/50 mt-0.5">{artist.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ALBUM & PLAYLIST */}
                {(filteredResults.albums.length > 0 || filteredResults.playlists.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredResults.albums.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Disc className="w-4 h-4 text-emerald-400" /> Album
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {filteredResults.albums.map((album) => (
                            <div
                              key={album.id}
                              className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all"
                            >
                              <img src={album.image} alt={album.title} className="w-14 h-14 rounded-xl object-cover" />
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">{album.title}</h4>
                                <p className="text-xs text-white/50 truncate">{album.artist}</p>
                                <p className="text-[10px] text-white/30 mt-1">{album.year} • {album.tracksCount} bài</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredResults.playlists.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-amber-400" /> Playlist
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          {filteredResults.playlists.map((pl) => (
                            <div
                              key={pl.id}
                              className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all"
                            >
                              <img src={pl.image} alt={pl.name} className="w-14 h-14 rounded-xl object-cover" />
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-white truncate">{pl.name}</h4>
                                <p className="text-xs text-white/50 truncate">{pl.owner}</p>
                                <p className="text-[10px] text-white/30 mt-1">{pl.songCount} bài hát</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB BÀI HÁT */}
            {activeTab === "songs" && (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl divide-y divide-white/[0.03]">
                {filteredResults.songs.map((song, index) => {
                  const isCurrent = String(currentTrack?.id) === String(song.id);
                  const liked = isLiked(song.id);

                  return (
                    <div
                      key={song.id}
                      onClick={() => playTrack(song as any, filteredResults.songs as any, "Tìm kiếm")}
                      className={`grid grid-cols-12 items-center px-6 py-4 transition-all cursor-pointer group ${
                        isCurrent ? "bg-indigo-500/15 border-l-4 border-indigo-500 text-indigo-400" : "hover:bg-white/5"
                      }`}
                    >
                      <div className="col-span-1 text-xs font-mono font-bold text-white/40">
                        {index + 1 < 10 ? `0${index + 1}` : index + 1}
                      </div>

                      <div className="col-span-6 flex items-center gap-3 min-w-0">
                        <img src={song.image} alt={song.title} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                        <div className="truncate">
                          <h4 className={`text-sm font-bold truncate ${isCurrent ? "text-indigo-400" : "text-white"}`}>
                            {song.title}
                          </h4>
                          <p className="text-xs text-white/50 truncate mt-0.5">{song.artist}</p>
                        </div>
                      </div>

                      <div className="col-span-3 text-xs text-white/50 truncate">{song.album}</div>

                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(song);
                          }}
                          className="text-white/30 hover:text-pink-500 p-1.5 transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
                        </button>
                        <TrackActionMenu track={song as any} />
                        <span className="text-xs font-mono text-white/40 ml-1">{formatDuration(song.duration)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB NGHỆ SĨ */}
            {activeTab === "artists" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredResults.artists.map((artist) => (
                  <div
                    key={artist.id}
                    className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 p-5 rounded-3xl flex flex-col items-center text-center space-y-4 cursor-pointer transition-all hover:scale-105"
                  >
                    <img src={artist.image} alt={artist.name} className="w-32 h-32 rounded-full object-cover shadow-2xl border border-white/10" />
                    <div>
                      <h4 className="text-base font-bold text-white truncate">{artist.name}</h4>
                      <p className="text-xs text-white/50 mt-1">{artist.followers} người theo dõi</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB ALBUM */}
            {activeTab === "albums" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredResults.albums.map((album) => (
                  <div
                    key={album.id}
                    className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 p-4 rounded-2xl flex flex-col space-y-3 cursor-pointer transition-all hover:scale-105"
                  >
                    <img src={album.image} alt={album.title} className="w-full aspect-square rounded-xl object-cover shadow-lg" />
                    <div>
                      <h4 className="text-sm font-bold text-white truncate">{album.title}</h4>
                      <p className="text-xs text-white/50 truncate mt-0.5">{album.artist}</p>
                      <p className="text-[10px] text-white/30 mt-1">{album.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB PLAYLIST */}
            {activeTab === "playlists" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredResults.playlists.map((pl) => (
                  <div
                    key={pl.id}
                    className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 p-4 rounded-2xl flex flex-col space-y-3 cursor-pointer transition-all hover:scale-105"
                  >
                    <img src={pl.image} alt={pl.name} className="w-full aspect-square rounded-xl object-cover shadow-lg" />
                    <div>
                      <h4 className="text-sm font-bold text-white truncate">{pl.name}</h4>
                      <p className="text-xs text-white/50 truncate mt-0.5">{pl.owner}</p>
                      <p className="text-[10px] text-white/30 mt-1">{pl.songCount} bài hát</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/[0.01] space-y-3">
            <Search className="w-10 h-10 text-white/20 mx-auto" />
            <h3 className="text-base font-bold text-white">Không tìm thấy kết quả nào cho "{searchQuery}"</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              Hãy kiểm tra lại chính tả hoặc thử tìm kiếm với các từ khóa khác như tên ca sĩ, tên bài hát.
            </p>
          </div>
        )
      ) : (
        /* MÀN HÌNH KHÁM PHÁ BAN ĐẦU */
        <div className="space-y-6 pt-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" /> Khám phá thể loại phổ biến
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "V-Pop", color: "from-pink-500 to-rose-600" },
              { name: "Hip-Hop / Rap", color: "from-amber-500 to-orange-600" },
              { name: "Indie Việt", color: "from-emerald-500 to-teal-600" },
              { name: "R&B / Chill", color: "from-indigo-500 to-purple-600" },
              { name: "Dance Pop", color: "from-cyan-500 to-blue-600" },
              { name: "Lo-fi Beats", color: "from-fuchsia-500 to-pink-600" }
            ].map((genre) => (
              <div
                key={genre.name}
                onClick={() => setSearchQuery(genre.name)}
                className={`h-28 rounded-2xl p-4 bg-gradient-to-br ${genre.color} flex items-end justify-start cursor-pointer hover:scale-105 transition-all shadow-lg font-bold text-sm tracking-wide`}
              >
                {genre.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}