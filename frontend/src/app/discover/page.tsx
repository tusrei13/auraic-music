"use client";

import { useState, useEffect } from "react";
import { Compass, Play, Hash, Heart, Radio, Sparkles, Loader2 } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { formatDuration, getJamendoTracks, getSongs, type JamendoSong } from "@/lib/api";
import TrackActionMenu from "@/components/TrackActionMenu";

export default function DiscoverPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jamendoTracks, setJamendoTracks] = useState<JamendoSong[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("Tất cả");

  const store = usePlayerStore() as any;
  const likedIds: (number | string)[] = store.likedIds || [];
  const currentTrack = store.currentTrack || null;
  const toggleLike = store.toggleLike || (() => {});

  useEffect(() => {
    getSongs()
      .then((songsData) => {
        setSongs(Array.isArray(songsData) ? songsData : []);
      })
      .catch((err) => console.error("Lỗi tải dữ liệu Khám phá:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getJamendoTracks({ limit: 12, tags: "pop rock electronic" })
      .then(setJamendoTracks)
      .catch(() => setJamendoTracks([]));
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
  const extractedGenres = Array.from(new Set(songs.flatMap((song) => song.genres || [])));
  const featuredGenres = ["lounge", "classical", "electronic", "jazz", "pop", "hiphop", "relaxation", "rock", "songwriter", "world", "metal", "soundtrack"];
  const genres = ["Tất cả", ...Array.from(new Set([...featuredGenres, ...extractedGenres]))];

  // Lọc bài hát theo Tìm kiếm và Thể loại chọn
  const filteredTracks = songs.filter((track) => {
    const artistName = typeof track.artist === "object" ? track.artist?.name : track.artist || "";
    const trackGenres = track.genres || [];

    const matchGenre = selectedGenre === "Tất cả" || trackGenres.includes(selectedGenre);

    return matchGenre;
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
              const genreName = song.genres?.slice(0, 2).join(" · ") || "Jamendo";
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

      {jamendoTracks.length > 0 && (
        <section className="space-y-4 border-t border-white/10 pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Nhạc quốc tế</h2>
              <p className="mt-1 text-xs text-white/40">Tuyển chọn từ Jamendo</p>
            </div>
            <span className="text-xs text-white/50">{jamendoTracks.length} bài hát</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jamendoTracks.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => handlePlayTrack(track, jamendoTracks)}
                className="group flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.04] p-3 text-left transition hover:border-indigo-400/40 hover:bg-white/[0.08]"
              >
                <img src={track.image} alt={track.title} className="h-14 w-14 rounded-xl object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-white group-hover:text-indigo-300">{track.title}</span>
                  <span className="mt-1 block truncate text-xs text-white/50">{track.artist.name}</span>
                  <span className="mt-1 block text-[11px] font-mono text-white/35">{formatDuration(track.duration)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* SECTION TÂM TRẠNG & HOẠT ĐỘNG */}
      {
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
      }
    </div>
  );
}