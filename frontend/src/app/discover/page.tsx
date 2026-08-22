"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Compass, Play, Hash, Heart, Mic2, Radio, Sparkles, Loader2 } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { formatDuration, getSongs, getArtists } from "@/lib/api";
import TrackActionMenu from "@/components/TrackActionMenu";

export default function DiscoverPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Tất cả");

  const store = usePlayerStore() as any;
  const likedIds: (number | string)[] = store.likedIds || [];
  const currentTrack = store.currentTrack || null;
  const toggleLike = store.toggleLike || (() => {});

  useEffect(() => {
    Promise.all([getSongs(), getArtists()])
      .then(([songsData, artistsData]) => {
        setSongs(Array.isArray(songsData) ? songsData : []);
        setArtists(Array.isArray(artistsData) ? artistsData : []);
      })
      .catch((err) => console.error("Lỗi tải dữ liệu Khám phá:", err))
      .finally(() => setLoading(false));
  }, []);

  const handlePlayTrack = (track: any, list: any[]) => {
    if (typeof store.playTrack === "function") {
      store.playTrack(track, list);
    } else if (typeof store.setCurrentTrack === "function") {
      store.setCurrentTrack(track);
    }
  };

  const isLiked = (id: number | string) => {
    return likedIds.some((likedId) => String(likedId) === String(id));
  };

  // Trích xuất tự động danh sách thể loại từ Database
  const extractedGenres = Array.from(
    new Set(
      songs
        .map((s) => (typeof s.genre === "object" ? s.genre?.name : s.genre))
        .filter(Boolean)
    )
  );
  const genres = ["Tất cả", ...extractedGenres];

  // Lọc bài hát theo Tìm kiếm và Thể loại chọn
  const filteredTracks = songs.filter((track) => {
    const artistName = typeof track.artist === "object" ? track.artist?.name : track.artist || "";
    const genreName = typeof track.genre === "object" ? track.genre?.name : track.genre || "";

    const matchSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artistName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGenre = selectedGenre === "Tất cả" || genreName === selectedGenre;

    return matchSearch && matchGenre;
  });

  const moodCategories = [
    { title: "Tập trung làm việc", desc: "Deep Focus & Ambient", bg: "from-blue-600/30 to-indigo-900/40" },
    { title: "Chill Đêm Muộn", desc: "Lofi Beats & Late Night", bg: "from-purple-600/30 to-pink-900/40" },
    { title: "Năng lượng ngày mới", desc: "Pop & Upbeat Vibes", bg: "from-amber-600/30 to-rose-900/40" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-white/50 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <span className="text-sm font-medium">Đang tải kho nhạc từ server...</span>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 h-full overflow-y-auto scrollbar-none pb-28">
      {/* THANH TÌM KIẾM NỔI */}
      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-white/40" />
        </div>
        <input
          type="text"
          placeholder="Tìm bài hát, nghệ sĩ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/[0.05] border border-white/10 text-white rounded-full py-3.5 pl-12 pr-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/[0.08] transition-all backdrop-blur-md shadow-lg font-medium text-sm placeholder-white/40"
        />
      </div>

      {/* FILTER THỂ LOẠI */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Compass className="w-5 h-5 text-indigo-400" /> Khám phá thể loại
        </h2>
        <div className="flex flex-wrap gap-3">
          {genres.map((genreName) => (
            <button
              key={genreName}
              onClick={() => setSelectedGenre(genreName)}
              className={`px-5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedGenre === genreName
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                  : "border-white/10 hover:bg-white/10 text-white/70"
              }`}
            >
              {selectedGenre === genreName && <Hash className="w-3.5 h-3.5 inline-block mr-1" />}
              {genreName}
            </button>
          ))}
        </div>
      </div>

      {/* KẾT QUẢ HIỂN THỊ BÀI HÁT */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h2 className="text-lg font-bold text-white">Kết quả nổi bật</h2>
          <span className="text-xs text-white/50">{filteredTracks.length} bài hát</span>
        </div>

        {filteredTracks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {filteredTracks.map((song) => {
              const liked = isLiked(song.id);
              const isPlayingThis = String(currentTrack?.id) === String(song.id);
              const artistName = typeof song.artist === "object" ? song.artist?.name : song.artist || "Nghệ sĩ";
              const genreName = typeof song.genre === "object" ? song.genre?.name : song.genre || "N/A";
              const songCover = song.image || song.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";

              return (
                <div
                  key={song.id}
                  onClick={() => handlePlayTrack(song, filteredTracks)}
                  className={`group relative p-4 rounded-2xl flex items-center justify-between transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl border ${
                    isPlayingThis
                      ? "bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_25px_rgba(99,102,241,0.25)]"
                      : "bg-white/[0.04] hover:bg-white/[0.08] border-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                      <img
                        src={songCover}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

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
                      <h4
                        className={`font-bold text-sm transition-colors truncate ${
                          isPlayingThis ? "text-indigo-400" : "text-white group-hover:text-indigo-300"
                        }`}
                      >
                        {song.title}
                      </h4>
                      <p className="text-xs text-white/50 truncate mt-0.5">{artistName}</p>
                      <span className="inline-block mt-1.5 text-[10px] font-medium bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 rounded-md">
                        {genreName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {song.duration && (
                      <span className="text-xs font-mono text-white/40 mr-1">{formatDuration(song.duration)}</span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                        liked ? "bg-pink-500/10 text-pink-400 border border-pink-500/20" : "bg-white/5 text-white/40 hover:text-white"
                      }`}
                      title={liked ? "Bỏ thích" : "Yêu thích"}
                    >
                      <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
                    </button>

                    <TrackActionMenu track={song} />
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

      {/* SECTION NGHỆ SĨ XU HƯỚNG TỪ DATABASE */}
      {!searchQuery && artists.length > 0 && (
        <>
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Mic2 className="w-5 h-5 text-indigo-400" /> Nghệ sĩ xu hướng
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {artists.map((artist) => (
                <Link
                  key={artist.id}
                  href={`/artist/${encodeURIComponent(artist.name)}`}
                  className="bg-white/[0.02] hover:bg-white/[0.06] p-4 rounded-2xl border border-white/5 text-center transition-all group cursor-pointer hover:border-indigo-500/30"
                >
                  <img
                    src={artist.avatar || artist.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop"}
                    alt={artist.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-3 shadow-lg group-hover:scale-105 transition-transform"
                  />
                  <h4 className="font-bold text-sm text-white truncate">{artist.name}</h4>
                  <p className="text-[11px] text-white/40 mt-0.5 truncate">
                    {artist.listeners ? `${(artist.listeners / 1000000).toFixed(1)}M người nghe` : `${artist.songs?.length || 0} bài hát`}
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* SECTION TÂM TRẠNG & HOẠT ĐỘNG */}
          <section className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Tâm trạng & Hoạt động
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {moodCategories.map((mood, idx) => (
                <div
                  key={idx}
                  className={`bg-gradient-to-br ${mood.bg} p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all cursor-pointer group flex flex-col justify-between h-28`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {mood.title}
                    </h3>
                    <Radio className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-xs text-white/60">{mood.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}