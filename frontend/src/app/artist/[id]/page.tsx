"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import TrackActionMenu from "@/components/TrackActionMenu";
import { formatDuration, getJamendoTracks } from "@/lib/api";
import { 
  Play, 
  Music, 
  Disc, 
  Heart, 
  UserPlus, 
  UserCheck, 
  BadgeCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const artistId = decodeURIComponent(id);
  const searchParams = useSearchParams();
  const artistNameHint = searchParams.get("name") || artistId;

  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [showAllAlbums, setShowAllAlbums] = useState(false);

  const { currentTrack, isPlaying, playTrack, likedIds = [], toggleLike } = usePlayerStore();

  useEffect(() => {
    let active = true;
    setLoading(true);
    const loadArtist = async () => {
      try {
        const isJamendoId = artistId.startsWith("jamendo:");
        let songs = isJamendoId
          ? await getJamendoTracks({ limit: 200, artistId })
          : await getJamendoTracks({ limit: 200, artistName: artistNameHint });
        if (isJamendoId && songs.length === 0 && artistNameHint !== artistId) {
          const fallbackSongs = await getJamendoTracks({ limit: 200, search: artistNameHint });
          songs = fallbackSongs.filter((song) => song.artist.name.toLowerCase() === artistNameHint.toLowerCase());
        }
        if (active) setArtist({
          name: songs[0]?.artist.name || artistNameHint,
          avatar: songs[0]?.artist.avatar || songs[0]?.image,
          songs,
        });
      } catch {
        if (active) setArtist(null);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadArtist();
    return () => { active = false; };
  }, [artistId, artistNameHint]);

  useEffect(() => {
    setShowAllSongs(false);
    setShowAllAlbums(false);
  }, [artistId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white/50 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        <span>Đang tải thông tin nghệ sĩ...</span>
      </div>
    );
  }

  const artistName = artist?.name || artistNameHint;
  const artistSongs: any[] = artist?.songs || [];
  const artistImage = artist?.avatar || artist?.image || artistSongs[0]?.image || artistSongs[0]?.coverUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";

  // Gom nhóm danh sách Album từ bài hát
  const albums = Array.from(new Map(
    artistSongs.filter((song: any) => song.album).map((song: any) => [song.album.id, song.album])
  ).values()) as Array<{ id: string; title: string; coverImage: string }>;
  const visibleSongs = showAllSongs ? artistSongs : artistSongs.slice(0, 8);
  const visibleAlbums = showAllAlbums ? albums : albums.slice(0, 6);

  const isLiked = (songId: number | string) =>
    (likedIds || []).some((likedId: any) => String(likedId) === String(songId));

  return (
    <div className="min-h-full overflow-y-auto scrollbar-none pb-28 text-white bg-[#09090b] p-6 sm:p-8 space-y-10">
      {/* Banner Nghệ Sĩ */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-black p-6 sm:p-8 border border-white/10 flex flex-col md:flex-row items-center gap-6 sm:gap-8 shadow-2xl">
        <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden shadow-2xl border-4 border-indigo-500/30 flex-shrink-0 relative group">
          <img
            src={artistImage}
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
              onClick={() => artistSongs.length > 0 && playTrack(artistSongs[0], artistSongs)}
              disabled={artistSongs.length === 0}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-full shadow-lg shadow-indigo-600/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer text-xs sm:text-sm disabled:opacity-50"
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
            visibleSongs.map((song: any, index: number) => {
              const isCurrent = String(currentTrack?.id) === String(song.id);
              const liked = isLiked(song.id);
              const songCover = song.image || song.coverUrl || artistImage;
              const albumTitle = typeof song.album === "object" ? song.album?.title : song.album || "Single";

              return (
                <div
                  key={song.id}
                  style={{ zIndex: artistSongs.length - index }}
                  onClick={() => playTrack(song, artistSongs)}
                  className={`grid grid-cols-12 items-center px-4 sm:px-6 py-3.5 transition-all cursor-pointer group border-b border-white/5 last:border-0 relative hover:z-20 ${
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
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    )}
                  </div>

                  <div className="col-span-7 sm:col-span-6 flex items-center gap-3 min-w-0 pr-2">
                    <img src={songCover} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    <div className="truncate">
                      <h4 className={`text-sm font-semibold truncate ${isCurrent ? "text-indigo-400 font-bold" : "text-white group-hover:text-indigo-300"}`}>
                        {song.title}
                      </h4>
                      <p className="text-xs text-white/40 truncate">{albumTitle}</p>
                    </div>
                  </div>

                  <div className="hidden sm:block sm:col-span-2 text-xs text-white/40 truncate">
                    {albumTitle}
                  </div>

                  <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-2 sm:gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song);
                      }}
                      className="p-1.5 text-white/40 hover:text-pink-500 transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${liked ? "fill-pink-500 text-pink-500" : ""}`} />
                    </button>

                    <span className="text-xs font-mono text-white/40">{formatDuration(song.duration)}</span>
                    <TrackActionMenu track={song} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-white/40 text-sm">Không thể tải bài hát của nghệ sĩ này từ Auraic. Hãy thử tải lại trang.</div>
          )}
        </div>
        {artistSongs.length > 8 && (
          <button
            type="button"
            aria-expanded={showAllSongs}
            onClick={() => setShowAllSongs((value) => !value)}
            className="mx-auto flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white/75 transition hover:border-indigo-400/50 hover:bg-indigo-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            {showAllSongs ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
            {showAllSongs ? "Thu gọn bài hát" : `Xem thêm ${artistSongs.length - 8} bài hát`}
          </button>
        )}
      </section>

      {/* Album & Đĩa đơn */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Disc className="w-5 h-5 text-purple-400" /> Album & Sản phẩm phát hành
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {albums.length > 0 ? (
            visibleAlbums.map((album) => (
              <Link
                href={`/album/${encodeURIComponent(album.id)}?name=${encodeURIComponent(album.title)}`}
                key={album.id}
                className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3 hover:border-indigo-500/50 hover:bg-white/[0.08] transition-all group cursor-pointer"
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-white/10 shadow-lg">
                  <img
                    src={album.coverImage || artistImage}
                    alt={album.title || "Album"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate">{album.title}</h3>
                  <p className="text-xs text-white/40 mt-0.5">Album chính thức</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
              <img
                src={artistImage}
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
        {albums.length > 6 && (
          <button
            type="button"
            aria-expanded={showAllAlbums}
            onClick={() => setShowAllAlbums((value) => !value)}
            className="mx-auto flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white/75 transition hover:border-purple-400/50 hover:bg-purple-500/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            {showAllAlbums ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
            {showAllAlbums ? "Thu gọn album" : `Xem thêm ${albums.length - 6} album`}
          </button>
        )}
      </section>
    </div>
  );
}
