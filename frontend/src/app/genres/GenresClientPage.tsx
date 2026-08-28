"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Play, Heart, Disc3 } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useGenreTracks, pickRandomTrack } from "@/hooks/useGenreTracks";
import { useDebounce } from "@/hooks/useDebounce";
import TrackActionMenu from "@/components/TrackActionMenu";
import Artwork from "@/components/Artwork";
import { containerVariants, fadeIn, scaleIn, slideIn, TiltCard } from "@/lib/motion";

const genreCards = [
  { name: "Electronic", tag: "electronic", note: "Pulse, synth and motion", gradient: "from-fuchsia-600/40 to-violet-900/30", accent: "#A855F7", accentSoft: "rgba(168,85,247,0.35)", particles: 32, shape: "circle" },
  { name: "Rock", tag: "rock", note: "Guitars with a little edge", gradient: "from-rose-600/35 to-orange-900/30", accent: "#F43F5E", accentSoft: "rgba(244,63,94,0.35)", particles: 28, shape: "square" },
  { name: "Hip hop", tag: "hiphop", note: "Beats, words and attitude", gradient: "from-cyan-600/35 to-blue-900/30", accent: "#06B6D4", accentSoft: "rgba(6,182,212,0.35)", particles: 30, shape: "circle" },
  { name: "Ambient", tag: "ambient", note: "Space to think clearly", gradient: "from-indigo-600/35 to-cyan-900/30", accent: "#6366F1", accentSoft: "rgba(99,102,241,0.35)", particles: 34, shape: "circle" },
  { name: "Jazz", tag: "jazz", note: "Warm chords after dark", gradient: "from-amber-600/35 to-pink-900/30", accent: "#F59E0B", accentSoft: "rgba(245,158,11,0.35)", particles: 26, shape: "square" },
  { name: "Classical", tag: "classical", note: "Timeless, cinematic detail", gradient: "from-emerald-600/30 to-cyan-900/30", accent: "#10B981", accentSoft: "rgba(16,185,129,0.35)", particles: 24, shape: "square" },
  { name: "Pop", tag: "pop", note: "Bright hooks and clean production", gradient: "from-pink-600/35 to-rose-900/30", accent: "#EC4899", accentSoft: "rgba(236,72,153,0.35)", particles: 28, shape: "circle" },
  { name: "R&B", tag: "rnb", note: "Smooth vocals and velvet rhythm", gradient: "from-violet-600/35 to-indigo-900/30", accent: "#8B5CF6", accentSoft: "rgba(139,92,246,0.35)", particles: 26, shape: "square" },
  { name: "Soul", tag: "soul", note: "Raw emotion and warm groove", gradient: "from-orange-600/35 to-red-900/30", accent: "#F97316", accentSoft: "rgba(249,115,22,0.35)", particles: 24, shape: "circle" },
  { name: "Folk", tag: "folk", note: "Acoustic stories and earthy tones", gradient: "from-lime-600/30 to-emerald-900/30", accent: "#84CC16", accentSoft: "rgba(132,204,22,0.35)", particles: 22, shape: "square" },
  { name: "Blues", tag: "blues", note: "Deep roots and soulful grit", gradient: "from-blue-600/35 to-slate-900/30", accent: "#3B82F6", accentSoft: "rgba(59,130,246,0.35)", particles: 24, shape: "square" },
  { name: "World", tag: "world", note: "Global rhythms and colors", gradient: "from-teal-600/35 to-emerald-900/30", accent: "#14B8A6", accentSoft: "rgba(20,184,166,0.35)", particles: 26, shape: "circle" },
];

const SkeletonTrack = () => (
  <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
    <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-white/10" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
    </div>
    <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
  </div>
);

const GenreTrackRow = function GenreTrackRow({
  track,
  isPlayingThis,
  liked,
  artistName,
  genreName,
  onPlay,
  onToggleLike,
}: {
  track: import("@/lib/api").JamendoSong;
  isPlayingThis: boolean;
  liked: boolean;
  artistName: string;
  genreName: string;
  onPlay: () => void;
  onToggleLike: () => void;
}) {
  return (
    <div
      onClick={onPlay}
      className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 cursor-pointer hover:translate-x-2 ${
        isPlayingThis ? "border-fuchsia-300/50 bg-fuchsia-300/10 shadow-[0_0_30px_rgba(217,140,255,0.15)]" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/20"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-transparent to-cyan-400/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-center gap-4">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
          <div className="h-full w-full overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-110">
            <Artwork src={track.image || track.album?.coverImage || ""} alt={track.title} className="h-full w-full object-cover" />
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            <Play className="h-5 w-5 fill-white text-white ml-0.5" />
          </div>
          {isPlayingThis && (
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-[3px] rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-400"
                  animate={{ scaleY: [0.4, 1, 0.6, 1, 0.8] }}
                  transition={{ duration: 0.7 + i * 0.12, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className={`truncate text-sm font-bold transition-colors ${isPlayingThis ? "text-fuchsia-300" : "text-white group-hover:text-fuchsia-200"}`}>
            {track.title}
          </h4>
          <p className="truncate text-xs text-white/50 mt-0.5">{artistName}</p>
          <span className="inline-block mt-1.5 text-[10px] font-medium bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 rounded-md">{genreName}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {track.duration && (
            <span className="text-xs font-mono text-white/35 mr-1">
              {Math.floor(track.duration / 60)}:{String(track.duration % 60).padStart(2, "0")}
            </span>
          )}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike();
            }}
            className={`p-2 rounded-xl transition-all ${liked ? "text-pink-400 bg-pink-500/10" : "text-white/40 hover:text-pink-300 hover:bg-white/5"}`}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            title={liked ? "Bỏ thích" : "Yêu thích"}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          </motion.button>
          <TrackActionMenu track={track} />
        </div>
      </div>
    </div>
  );
};

export default function GenresClientPage() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);

  const debouncedGenre = useDebounce(selectedGenre, 300);

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 220], [1, 0.35]);

  const store = usePlayerStore();
  const currentTrack = store.currentTrack || null;
  const toggleLike = store.toggleLike;
  const playTrack = store.playTrack;

  const currentImage = currentTrack?.image || "";

  const activeAccent = useMemo(() => {
    if (hoveredGenre) {
      const found = genreCards.find((g) => g.tag === hoveredGenre);
      if (found) return found.accentSoft;
    }
    if (selectedGenre) {
      const found = genreCards.find((g) => g.tag === selectedGenre);
      if (found) return found.accentSoft;
    }
    if (currentImage) return "rgba(168,85,247,0.35)";
    return "rgba(99,102,241,0.22)";
  }, [hoveredGenre, selectedGenre, currentImage]);

  const { data: tracks = [], isPending, isError, error, isSuccess, isFetching, refetch } = useGenreTracks(debouncedGenre);
  const isRequestLocked = Boolean(debouncedGenre) && (isFetching || isPending);

  const handleSelectGenre = useCallback((tag: string) => {
    if (isRequestLocked) return;
    setSelectedGenre((prev) => {
      if (prev === tag) return null;
      return tag;
    });
  }, [isRequestLocked]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!debouncedGenre || !tracks.length) return;
    const randomTrack = pickRandomTrack(tracks);
    if (randomTrack) {
      playTrack(randomTrack, tracks, debouncedGenre);
    }
  }, [debouncedGenre, tracks, playTrack]);

  const selectedGenreData = genreCards.find((g) => g.tag === selectedGenre);

  const pageBackground = useMemo(() => {
    if (!selectedGenre) return "transparent";
    const genre = genreCards.find((g) => g.tag === selectedGenre);
    if (!genre) return "transparent";

    const hex = genre.accent.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, 0.12)`;
  }, [selectedGenre]);

  return (
    <motion.div className="relative min-h-full overflow-y-auto scrollbar-none px-5 pb-36 pt-3 text-white sm:px-8 lg:px-12 transition-colors duration-700" style={{ backgroundColor: pageBackground }} variants={containerVariants} initial="hidden" animate="show">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute -left-20 top-10 h-96 w-96 rounded-full opacity-40 blur-[120px]"
          style={{ background: activeAccent }}
          animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        {currentImage && (
          <motion.div
            className="absolute -right-20 top-20 h-72 w-72 rounded-full opacity-25 blur-[100px]"
            style={{ backgroundImage: `url(${currentImage})`, backgroundSize: "cover" }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-auraic-bg/60 to-auraic-bg" />
      </div>

      <motion.header className="relative mt-2 overflow-hidden rounded-[28px] border border-auraic-border bg-auraic-surface/80 p-5 backdrop-blur-2xl sm:p-8" style={{ opacity: headerOpacity }} variants={fadeIn}>
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-[100px]" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-[80px]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300">
              <Disc3 className="h-4 w-4" /> Auraic catalog
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              <span className="bg-gradient-to-r from-fuchsia-300 via-violet-400 to-cyan-300 bg-clip-text text-transparent">Explore Genres</span>
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/55">Mỗi thể loại là một thế giới riêng. Chọn không gian âm nhạc phù hợp với bạn.</p>
          </div>
        </div>
      </motion.header>

      <motion.section className="mt-6" variants={slideIn}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {genreCards.map((genre, idx) => {
            const isActive = selectedGenre === genre.tag;
            return (
              <TiltCard key={genre.name}>
                <motion.button
                  type="button"
                  onClick={() => handleSelectGenre(genre.tag)}
                  onMouseEnter={() => setHoveredGenre(genre.tag)}
                  onMouseLeave={() => setHoveredGenre(null)}
                  disabled={isRequestLocked}
                  className={`group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border text-left backdrop-blur-2xl transition-all duration-150 aspect-[4/3] ${
                    isActive ? "border-white/25 shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-4" : "border-white/10 hover:border-white/20 p-4"
                  } ${selectedGenre && !isActive ? 'opacity-70' : ''} ${isRequestLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  variants={scaleIn}
                  custom={idx}
                  whileTap={{ scale: 0.97, transition: { type: "spring", stiffness: 400, damping: 15 } }}
                  layoutId={`genre-card-${genre.tag}`}
                >
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {Array.from({ length: genre.particles }).map((_, i) => (
                      <motion.span
                        key={i}
                        className="absolute rounded-full bg-white/40"
                        style={{
                          left: `${((i * 137.508) % 100)}%`,
                          top: `${((i * 293.871) % 100)}%`,
                          width: genre.shape === "circle" ? "3px" : "2px",
                          height: genre.shape === "circle" ? "3px" : "2px",
                        }}
                        animate={{
                          y: [0, -20 - (i % 5) * 6],
                          opacity: [0, 0.8, 0],
                          scale: [0.5, 1.2, 0.5],
                        }}
                        transition={{ duration: 3 + (i % 4) * 0.7, repeat: Infinity, ease: "easeInOut", delay: (i % 5) * 0.4 }}
                      />
                    ))}
                  </div>

                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0"
                    initial={false}
                    whileHover={{ opacity: 1, x: ["-100%", "100%"] }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                  />

                  <div className={`absolute inset-0 bg-gradient-to-br ${genre.gradient} opacity-80`} />
                  <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-xl" />

                  <div className="relative flex h-full flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">{genre.name}</h3>
                      <p className={`mt-0.5 text-[11px] text-white/60 font-medium leading-tight ${selectedGenre ? 'hidden' : ''}`}>{genre.note}</p>
                    </div>
                  </div>

                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{ background: genre.accent }}
                      layoutId="genre-indicator"
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    />
                  )}
                </motion.button>
              </TiltCard>
            );
          })}
        </div>
      </motion.section>

      {selectedGenre && (
        <section className="mt-10 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                {selectedGenreData?.name || selectedGenre} catalog
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                {selectedGenreData?.name || selectedGenre}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">{tracks.length} bài hát</span>
            </div>
          </div>

          {isPending || isFetching ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonTrack key={i} />
              ))}
            </div>
          ) : isError ? (
            <div role="alert" className="rounded-2xl border border-rose-300/25 bg-rose-300/[0.08] px-5 py-10 text-center text-sm text-rose-100">
              <p className="mb-2 font-semibold">Hệ thống đang quá tải do thao tác quá nhanh</p>
              <p className="text-xs text-rose-200/70">{(error as Error)?.message || "Vui lòng thử lại sau vài giây."}</p>
              <motion.button type="button" onClick={handleRetry} className="mt-4 min-h-11 rounded-xl border border-rose-200/30 px-4 font-semibold hover:bg-rose-200/10" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Thử lại
              </motion.button>
            </div>
          ) : isSuccess && tracks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-12 text-center">
              <p className="text-white/50 text-sm font-medium">Không tìm thấy bài hát nào phù hợp</p>
              <p className="mt-1 text-xs text-white/35">Thử chọn thể loại khác.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tracks.map((track) => {
                const liked = store.likedIds?.some((id: any) => String(id) === String(track.id));
                const isPlayingThis = String(currentTrack?.id) === String(track.id);
                const artistName = typeof track.artist === "object" ? track.artist?.name : track.artist || "Nghệ sĩ";
                const genreName = track.genres?.slice(0, 2).join(" · ") || selectedGenre || "";

                return (
                  <GenreTrackRow
                    key={track.id}
                    track={track}
                    isPlayingThis={isPlayingThis}
                    liked={!!liked}
                    artistName={artistName}
                    genreName={genreName}
                    onPlay={() => playTrack(track as any, tracks as any, selectedGenre)}
                    onToggleLike={() => toggleLike(track)}
                  />
                );
              })}
            </div>
          )}
        </section>
      )}
    </motion.div>
  );
}
