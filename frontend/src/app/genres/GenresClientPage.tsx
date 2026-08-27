"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Play, Heart, Loader2, Disc3, ChevronRight } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getJamendoTracks, type JamendoSong } from "@/lib/api";
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

const featuredGenres = ["electronic", "ambient", "jazz", "pop"];

function pickRandomTrack(tracks: JamendoSong[]): JamendoSong | null {
  if (tracks.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * tracks.length);
  return tracks[randomIndex];
}

export default function GenresClientPage() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [tracks, setTracks] = useState<JamendoSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 220], [1, 0.35]);

  const store = usePlayerStore() as any;
  const likedIds: (number | string)[] = store.likedIds || [];
  const currentTrack = store.currentTrack || null;
  const toggleLike = store.toggleLike || (() => {});
  const playTrack = store.playTrack || (() => {});
  const playMix = store.playMix || (() => {});

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

  const loadGenreTracks = useCallback(async (tag: string) => {
    setLoading(true);
    setCatalogError(null);
    try {
      const remote = await getJamendoTracks({ limit: 24, tags: tag });
      setTracks(remote);
      return remote;
    } catch {
      setTracks([]);
      setCatalogError("Không thể tải danh sách bài hát lúc này.");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectGenre = async (tag: string) => {
    const isAlreadySelected = selectedGenre === tag;

    if (isAlreadySelected) {
      setSelectedGenre(null);
      setTracks([]);
      return;
    }

    setSelectedGenre(tag);
    const remote = await loadGenreTracks(tag);
    const randomTrack = pickRandomTrack(remote);

    if (randomTrack) {
      playTrack(randomTrack, remote, tag);
    }
  };

  const handlePlayGenre = (tag: string) => {
    if (tracks.length > 0) {
      playMix(tracks, `${tag} mix`);
    }
  };

  const selectedGenreData = genreCards.find((g) => g.tag === selectedGenre);

  return (
    <motion.div className="relative min-h-full overflow-y-auto scrollbar-none px-5 pb-36 pt-3 text-white sm:px-8 lg:px-12" variants={containerVariants} initial="hidden" animate="show">
      {/* Adaptive ambient background */}
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

      {/* Compact Hero Banner */}
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

          {/* Featured genre highlight reel */}
          <div className="flex items-center gap-3">
            {featuredGenres.map((tag) => {
              const genre = genreCards.find((g) => g.tag === tag);
              if (!genre) return null;
              const isActive = selectedGenre === tag;
              return (
                <motion.button
                  key={tag}
                  type="button"
                  onClick={() => handleSelectGenre(tag)}
                  className={`relative flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive ? "border-white/30 bg-white/15 text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]" : "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:text-white"
                  }`}
                  whileHover={{ scale: 1.05, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  whileTap={{ scale: 0.95, transition: { type: "spring", stiffness: 400, damping: 15 } }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: genre.accent }} />
                  {genre.name}
                  {isActive && <ChevronRight className="h-3 w-3" />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.header>

      {/* Genre Bento Grid */}
      <motion.section className="mt-6" variants={slideIn}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {genreCards.map((genre, idx) => {
            const isActive = selectedGenre === genre.tag;
            const isHovered = hoveredGenre === genre.tag;

            return (
              <TiltCard key={genre.name}>
                <motion.button
                  type="button"
                  onClick={() => handleSelectGenre(genre.tag)}
                  onMouseEnter={() => setHoveredGenre(genre.tag)}
                  onMouseLeave={() => setHoveredGenre(null)}
                  className={`group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border text-left backdrop-blur-2xl transition-all duration-150 aspect-[4/3] ${
                    isActive ? "border-white/25 shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-4" : "border-white/10 hover:border-white/20 p-4"
                  } ${selectedGenre && !isActive ? 'opacity-70' : ''}`}
                  variants={scaleIn}
                  custom={idx}
                   whileTap={{ scale: 0.97, transition: { type: "spring", stiffness: 400, damping: 15 } }}
                   layoutId={`genre-card-${genre.tag}`}
                 >
                  {/* Animated particles / texture */}
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

                  {/* Shimmer overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0"
                    initial={false}
                    whileHover={{ opacity: 1, x: ["-100%", "100%"] }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                  />

                  {/* Rich visual background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${genre.gradient} opacity-80`} />

                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-xl" />

                  {/* Content */}
                  <div className="relative flex h-full flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">{genre.name}</h3>
                      <p className={`mt-0.5 text-[11px] text-white/60 font-medium leading-tight ${selectedGenre ? 'hidden' : ''}`}>{genre.note}</p>
                    </div>

                    <div className={`mt-3 flex items-center justify-between ${selectedGenre ? 'mt-2' : ''}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: genre.accent }} />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                          {genre.tag}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white/90 backdrop-blur-md">
                        <Play className="h-3 w-3 fill-current" />
                        {isActive ? "Đang phát" : "Phát"}
                      </div>
                    </div>
                  </div>

                  {/* Active indicator */}
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

      {/* Genre Track List */}
      {selectedGenre && (
        <motion.section className="mt-10 space-y-4" variants={containerVariants} initial="hidden" animate="show" layout>
          <motion.div className="flex items-end justify-between" variants={fadeIn}>
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
              {tracks.length > 0 && (
                <motion.button
                  type="button"
                  onClick={() => handlePlayGenre(selectedGenre)}
                  className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-950 shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Phát tất cả
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Filter pills */}
          <motion.div className="flex gap-2 overflow-x-auto scrollbar-none pb-2" variants={slideIn}>
            {["latest", "popular", "random"].map((filter) => (
              <button
                key={filter}
                type="button"
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold capitalize text-white/70 transition hover:border-white/25 hover:text-white"
              >
                {filter === "latest" ? "Mới nhất" : filter === "popular" ? "Phổ biến" : "Ngẫu nhiên"}
              </button>
            ))}
          </motion.div>

          {loading ? (
            <motion.div className="flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]" variants={fadeIn}>
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-fuchsia-300" /> Tuning the catalog...
            </motion.div>
          ) : catalogError ? (
            <motion.div role="alert" className="rounded-2xl border border-rose-300/25 bg-rose-300/[0.08] px-5 py-10 text-center text-sm text-rose-100" variants={fadeIn}>
              <p className="mb-2 font-semibold">Không thể tải bài hát lúc này</p>
              <p className="text-xs text-rose-200/70">{catalogError}</p>
                 <motion.button type="button" onClick={() => loadGenreTracks(selectedGenre)} className="mt-4 min-h-11 rounded-xl border border-rose-200/30 px-4 font-semibold hover:bg-rose-200/10" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                Thử lại
              </motion.button>
            </motion.div>
          ) : tracks.length > 0 ? (
            <motion.div className="space-y-2" variants={containerVariants} initial="hidden" animate="show">
              {tracks.map((track, index) => {
                const liked = likedIds.some((id) => String(id) === String(track.id));
                const isPlayingThis = String(currentTrack?.id) === String(track.id);
                const artistName = typeof track.artist === "object" ? track.artist?.name : track.artist || "Nghệ sĩ";
                const genreName = track.genres?.slice(0, 2).join(" · ") || selectedGenre;

                return (
                  <motion.div
                    key={track.id}
                    variants={scaleIn}
                    custom={index}
                    whileHover={{ x: 8 }}
                    onClick={() => playTrack(track as any, tracks as any, selectedGenre)}
                    className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 cursor-pointer ${
                      isPlayingThis ? "border-fuchsia-300/50 bg-fuchsia-300/10 shadow-[0_0_30px_rgba(217,140,255,0.15)]" : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/20"
                    }`}
                  >
                    {/* Glass tint on hover */}
                    <motion.div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-transparent to-cyan-400/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="relative flex items-center gap-4">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                        <motion.div whileHover={{ scale: 1.08 }} transition={{ type: "spring", damping: 20, stiffness: 200 }}>
                          <Artwork src={track.image || track.album?.coverImage || ""} alt={track.title} className="h-full w-full object-cover" />
                        </motion.div>
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center bg-black/40"
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                        >
                          <Play className="h-5 w-5 fill-white text-white ml-0.5" />
                        </motion.div>
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
                            toggleLike(track);
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
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-12 text-center" variants={fadeIn}>
              <p className="text-white/50 text-sm font-medium">Không tìm thấy bài hát nào phù hợp</p>
              <p className="mt-1 text-xs text-white/35">Thử chọn thể loại khác.</p>
            </motion.div>
          )}
        </motion.section>
      )}
    </motion.div>
  );
}
