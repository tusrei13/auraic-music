"use client";

import { use, useState } from "react";
import { ALL_SYSTEM_SONGS, Track } from "@/app/library/page";
import { usePlayerStore } from "@/store/usePlayerStore";
import TrackActionMenu from "@/components/TrackActionMenu";
import { 
  Play, 
  Music, 
  Disc, 
  Heart, 
  UserPlus, 
  UserCheck, 
  BadgeCheck 
} from "lucide-react";

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const artistName = decodeURIComponent(id);

  const store = usePlayerStore() as any;
  const currentTrack = store.currentTrack;
  const isPlaying = store.isPlaying;
  const likedIds: (number | string)[] = store.likedIds || [];
  const toggleLike = store.toggleLike || (() => {});

  const [isFollowing, setIsFollowing] = useState(false);

  // Lọc bài hát thuộc nghệ sĩ
  const artistSongs = ALL_SYSTEM_SONGS.filter((s) => {
    const name = typeof s.artist === "object" ? s.artist.name : s.artist;
    return name.toLowerCase() === artistName.toLowerCase();
  });

  // Gom nhóm danh sách Album
  const albums = Array.from(
    new Set(artistSongs.map((s) => s.album).filter(Boolean))
  );

  const handlePlaySong = (song: Track) => {
    if (store.playTrack) {
      store.playTrack(song, artistSongs);
    } else if (store.setCurrentTrack) {
      store.setCurrentTrack(song);
    }
  };

  const isLiked = (songId: number | string) =>
    likedIds.some((likedId) => String(likedId) === String(songId));

  return (
    <div className="min-h-full overflow-y-auto scrollbar-none pb-28 text-white bg-[#09090b] p-6 sm:p-8 space-y-10">
      {/* Banner Nghệ Sĩ */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-black p-6 sm:p-8 border border-white/10 flex flex-col md:flex-row items-center gap-6 sm:gap-8 shadow-2xl">
        <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden shadow-2xl border-4 border-indigo-500/30 flex-shrink-0 relative group">
          <img
            src={artistSongs[0]?.image || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop"}
            alt={artistName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <div className="space-y-4 text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold uppercase text-indigo-400 tracking-widest">
            <BadgeCheck className="w-4 h-4 text-indigo-400" /> Nghệ sĩ xác minh
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-md">
            {artistName}
          </h1>
          <p className="text-xs sm:text-sm text-white/60 font-medium">
            {artistSongs.length} bài hát • {albums.length > 0 ? albums.length : 1} Album/Đĩa đơn
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              onClick={() => artistSongs.length > 0 && handlePlaySong(artistSongs[0])}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-full shadow-lg shadow-indigo-600/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-xs sm:text-sm"
            >
              <Play className="w-4 h-4 fill-white" /> Phát bài nổi bật
            </button>

            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={`inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full border transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-xs sm:text-sm ${
                isFollowing
                  ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                  : "bg-white text-black border-white hover:bg-white/90"
              }`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-4 h-4 text-indigo-400" /> Đang theo dõi
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Theo dõi
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách bài hát nổi bật */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Music className="w-5 h-5 text-indigo-400" /> Bài hát phổ biến
        </h2>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-visible backdrop-blur-xl">
          {artistSongs.length > 0 ? (
            artistSongs.map((song, index) => {
              const isCurrent = String(currentTrack?.id) === String(song.id);
              const liked = isLiked(song.id);

              return (
                <div
                  key={song.id}
                  style={{ zIndex: artistSongs.length - index }}
                  onClick={() => handlePlaySong(song)}
                  className={`grid grid-cols-12 items-center px-4 sm:px-6 py-3.5 transition-all cursor-pointer group border-b border-white/5 last:border-0 relative ${
                    isCurrent ? "bg-indigo-500/15" : "hover:bg-white/5"
                  }`}
                >
                  <div className="col-span-1 text-xs font-mono text-white/40 font-bold">
                    {isCurrent && isPlaying ? (
                      <div className="flex items-center gap-0.5">
                        <span className="w-1 h-3 bg-indigo-400 rounded-full animate-bounce" />
                        <span className="w-1 h-4 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    ) : (
                      <span>0{index + 1}</span>
                    )}
                  </div>

                  <div className="col-span-7 sm:col-span-6 flex items-center gap-3 min-w-0 pr-2">
                    <img src={song.image} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div className="truncate">
                      <h4 className={`text-sm font-semibold truncate ${isCurrent ? "text-indigo-400 font-bold" : "text-white group-hover:text-indigo-300"}`}>
                        {song.title}
                      </h4>
                      <p className="text-xs text-white/40 truncate">{song.album || "Single"}</p>
                    </div>
                  </div>

                  <div className="hidden sm:block sm:col-span-2 text-xs text-white/40 truncate">
                    {song.album || "Single"}
                  </div>

                  <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-2 sm:gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song.id);
                      }}
                      className="p-1.5 text-white/40 hover:text-pink-500 transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
                    </button>

                    <span className="text-xs font-mono text-white/40">{song.duration || "03:30"}</span>
                    <TrackActionMenu track={song} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-white/40 text-sm">Chưa có bài hát nào của nghệ sĩ này.</div>
          )}
        </div>
      </section>

      {/* Album & Đĩa đơn */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Disc className="w-5 h-5 text-purple-400" /> Album & Sản phẩm phát hành
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {albums.length > 0 ? (
            albums.map((albumName, idx) => (
              <div
                key={idx}
                className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3 hover:border-indigo-500/50 hover:bg-white/[0.08] transition-all group cursor-pointer"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-white/10 shadow-lg">
                  <img
                    src={artistSongs[idx]?.image || "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=500&auto=format&fit=crop"}
                    alt={albumName || "Album"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate">{albumName}</h3>
                  <p className="text-xs text-white/40 mt-0.5">Album chính thức</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
              <img
                src={artistSongs[0]?.image || "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=500&auto=format&fit=crop"}
                alt={artistName}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div>
                <h3 className="text-sm font-bold text-white">{artistName} - Singles</h3>
                <p className="text-xs text-white/40">Tất cả đĩa đơn đã phát hành</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}