"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Heart,
  Loader2,
  Sparkles,
  TrendingUp,
  Disc3,
  Users,
  ChevronLeft,
  ChevronRight,
  Radio,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getJamendoTracks, getSongs, getArtists } from "@/lib/api";
import TrackActionMenu from "@/components/TrackActionMenu";
import Artwork from "@/components/Artwork";
import {
  containerVariants,
  fadeIn,
  scaleIn,
  TiltCard,
} from "@/lib/motion";

const vibeFilters = [
  "Tất cả",
  "Chill",
  "Focus",
  "EDM",
  "Indie",
  "R&B",
  "Lofi",
  "Podcast",
  "Nhạc Việt",
  "Jazz",
  "Classical",
  "Workout",
];

const moodBentoItems = [
  {
    title: "Tập trung làm việc",
    desc: "Deep Focus & Ambient",
    gradient: "from-blue-600/30 to-indigo-900/40",
    icon: "◐",
    tags: "ambient piano",
    aura: "rgba(59, 130, 246, 0.25)",
  },
  {
    title: "Chill Đêm Muộn",
    desc: "Lofi Beats & Late Night",
    gradient: "from-purple-600/30 to-pink-900/40",
    icon: "☾",
    tags: "chillout lofi lounge",
    aura: "rgba(168, 85, 247, 0.25)",
  },
  {
    title: "Năng lượng ngày mới",
    desc: "Pop & Upbeat Vibes",
    gradient: "from-amber-600/30 to-rose-900/40",
    icon: "☀",
    tags: "pop dance",
    aura: "rgba(245, 158, 11, 0.25)",
  },
  {
    title: "Tập Gym",
    desc: "High Intensity Beats",
    gradient: "from-red-600/30 to-orange-900/40",
    icon: "⚡",
    tags: "electronic",
    aura: "rgba(239, 68, 68, 0.25)",
  },
  {
    title: "Đọc Sách",
    desc: "Soft Piano & Instrumental",
    gradient: "from-emerald-600/30 to-teal-900/40",
    icon: "📖",
    tags: "piano instrumental",
    aura: "rgba(16, 185, 129, 0.25)",
  },
  {
    title: "Bữa tiệc",
    desc: "Dance & Club Bangers",
    gradient: "from-fuchsia-600/30 to-violet-900/40",
    icon: "🎉",
    tags: "dance house",
    aura: "rgba(217, 70, 239, 0.25)",
  },
  {
    title: "Thư Giãn",
    desc: "Nature Sounds & Spa",
    gradient: "from-cyan-600/30 to-sky-900/40",
    icon: "🌿",
    tags: "nature ambient",
    aura: "rgba(6, 182, 212, 0.25)",
  },
  {
    title: "Thiền định",
    desc: "Brown Noise & Beats",
    gradient: "from-slate-600/30 to-zinc-900/40",
    icon: "🎯",
    tags: "ambient",
    aura: "rgba(100, 116, 139, 0.25)",
  },
];

const curatedSectionDefs = [
  {
    title: "Fresh Picks",
    subtitle: "Mới được thêm vào",
    icon: Sparkles,
    color: "text-amber-300",
    accent: "bg-amber-500",
    slice: [0, 14],
    key: "fresh" as const,
  },
  {
    title: "Trending Now",
    subtitle: "Đang thịnh hành",
    icon: TrendingUp,
    color: "text-rose-300",
    accent: "bg-rose-500",
    slice: [-14, undefined],
    key: "trending" as const,
  },
];

export default function DiscoverPage() {
  const [songs, setSongs] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [playingMood, setPlayingMood] = useState<string | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [activeVibe, setActiveVibe] = useState("Tất cả");
  const [hoveredBento, setHoveredBento] = useState<string | null>(null);
  const [artistHover, setArtistHover] = useState<string | null>(null);

  const store = usePlayerStore() as any;
  const likedIds: (number | string)[] = store.likedIds || [];
  const currentTrack = store.currentTrack || null;
  const toggleLike = store.toggleLike || (() => {});
  const playTrack = store.playTrack || (() => {});

  const currentImage = currentTrack?.image || "";
  const heroRef = useRef<HTMLDivElement>(null);
  const freshRef = useRef<HTMLDivElement>(null);
  const trendingRef = useRef<HTMLDivElement>(null);
  const artistsRef = useRef<HTMLDivElement>(null);

  const curatedTracks = useMemo(() => {
    const out: Record<string, any[]> = {};
    curatedSectionDefs.forEach((section) => {
      const raw = songs.slice(section.slice[0], section.slice[1]);
      out[section.key] = raw.filter(Boolean);
    });
    return out;
  }, [songs]);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setCatalogError(null);
    try {
      const [songsData, artistsData] = await Promise.all([
        getSongs(),
        getArtists().catch(() => []),
      ]);
      setSongs(Array.isArray(songsData) ? songsData : []);
      setArtists(Array.isArray(artistsData) ? artistsData : []);
    } catch {
      setSongs([]);
      setArtists([]);
      setCatalogError("Không thể tải catalog lúc này.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog, retryToken]);

  const playMood = async (mood: { title: string; tags: string }) => {
    setPlayingMood(mood.title);
    try {
      const tracks = await getJamendoTracks({ limit: 24, tags: mood.tags });
      if (tracks.length > 0) {
        playTrack(tracks[0], tracks, mood.title);
      }
    } catch {
      // Silently fail mood play
    } finally {
      setPlayingMood(null);
    }
  };

  const playAllCatalog = () => {
    if (songs.length > 0) {
      playTrack(songs[0], songs, "Discover");
    }
  };

  const isLiked = (id: number | string) =>
    likedIds.some((likedId) => String(likedId) === String(id));

  // Hero slider auto-advance
  useEffect(() => {
    if (songs.length === 0) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(songs.length, 5));
    }, 5000);
    return () => clearInterval(timer);
  }, [songs.length]);

  const heroTracks = useMemo(
    () => songs.slice(0, Math.min(songs.length, 5)),
    [songs]
  );

  const isLikedHero = (id: number | string) =>
    likedIds.some((likedId) => String(likedId) === String(id));

  const scrollSlider = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (!ref.current) return;
    const scrollAmount = 320;
    ref.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const renderHeroSlider = () => {
    if (heroTracks.length === 0) return null;
    const track = heroTracks[heroIndex];
    const artistName =
      typeof track.artist === "object"
        ? track.artist?.name
        : track.artist || "Nghệ sĩ";
    const songCover =
      track.image ||
      track.coverUrl ||
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=1200&auto=format&fit=crop";

    return (
      <motion.div
        ref={heroRef}
        className="relative mt-4 overflow-hidden rounded-[32px] border border-auraic-border bg-auraic-surface"
        variants={fadeIn}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={track.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative aspect-[16/9] sm:aspect-[21/9]"
          >
            <Artwork
              src={songCover}
              alt={track.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 via-transparent to-cyan-500/20 mix-blend-overlay" />

            <div className="absolute inset-0 flex items-end p-6 sm:p-10 lg:p-12">
              <div className="max-w-2xl">
                <motion.p
                  className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Radio className="h-4 w-4" /> Đang phổ biến
                </motion.p>
                <motion.h2
                  className="mt-3 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl text-white"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {track.title}
                </motion.h2>
                <motion.p
                  className="mt-2 text-sm sm:text-base text-white/60"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {artistName}
                </motion.p>
                <motion.div
                  className="mt-5 flex items-center gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.button
                    type="button"
                    onClick={() => playTrack(track, heroTracks, "Hero")}
                    className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-lg hover:bg-white/90"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="h-4 w-4 fill-current" /> Phát ngay
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => toggleLike(track)}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/20 backdrop-blur-md ${
                      isLikedHero(track.id)
                        ? "bg-pink-500/20 text-pink-400 border-pink-400/40"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        isLikedHero(track.id) ? "fill-current" : ""
                      }`}
                    />
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {heroTracks.length > 1 && (
          <>
            <motion.button
              type="button"
              onClick={() =>
                setHeroIndex((prev) =>
                  prev === 0 ? heroTracks.length - 1 : prev - 1
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:bg-black/60 hover:text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>
            <motion.button
              type="button"
              onClick={() =>
                setHeroIndex((prev) => (prev + 1) % heroTracks.length)
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:bg-black/60 hover:text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          </>
        )}

        {/* Dots */}
        {heroTracks.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {heroTracks.map((_, idx) => (
              <motion.button
                key={idx}
                type="button"
                onClick={() => setHeroIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === heroIndex
                    ? "w-6 bg-white"
                    : "w-2 bg-white/40 hover:bg-white/60"
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const renderQuickVibeFilters = () => (
    <motion.section className="mt-8" variants={fadeIn}>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
        {vibeFilters.map((filter) => (
          <motion.button
            key={filter}
            type="button"
            onClick={() => setActiveVibe(filter)}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold transition-all backdrop-blur-md border ${
              activeVibe === filter
                ? "bg-white/15 border-white/25 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {filter}
          </motion.button>
        ))}
      </div>
    </motion.section>
  );

  const renderBentoGrid = () => (
    <motion.section className="mt-12" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={fadeIn}>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-fuchsia-300">
          Tâm trạng & Hoạt động
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          Chọn không gian của bạn
        </h2>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {moodBentoItems.map((mood, idx) => (
          <TiltCard key={mood.title}>
            <motion.div
              className={`group relative overflow-hidden rounded-3xl border border-auraic-border bg-gradient-to-br ${mood.gradient} p-5 backdrop-blur-2xl cursor-pointer`}
              variants={scaleIn}
              custom={idx}
              onMouseEnter={() => setHoveredBento(mood.title)}
              onMouseLeave={() => setHoveredBento(null)}
              onClick={() => void playMood(mood)}
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                  className="absolute -inset-8 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: mood.aura }}
                />
              </div>

              <div className="relative flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white sm:text-base">
                    {mood.title}
                  </h3>
                  <p className="mt-1 text-[11px] text-white/60">{mood.desc}</p>
                </div>
                <span className="text-2xl text-white/70">{mood.icon}</span>
              </div>

              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void playMood(mood);
                }}
                disabled={playingMood === mood.title}
                className="relative mt-4 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/80 backdrop-blur-md transition hover:bg-white/15 disabled:opacity-60"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {playingMood === mood.title ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
                {playingMood === mood.title ? "Đang tải..." : "Phát ngay"}
              </motion.button>

              <motion.div
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ scaleX: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </TiltCard>
        ))}
      </div>
    </motion.section>
  );

  const renderSquareCard = (song: any, index: number, accent: string) => {
    const artistName =
      typeof song.artist === "object"
        ? song.artist?.name
        : song.artist || "Nghệ sĩ";
    const songCover =
      song.image ||
      song.coverUrl ||
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=500&auto=format&fit=crop";
    const isPlayingThis =
      String(currentTrack?.id) === String(song.id);

    return (
      <motion.div
        variants={scaleIn}
        custom={index}
        whileHover={{ y: -6, scale: 1.02 }}
        onClick={() => playTrack(song, song, "Discover")}
        className={`group relative overflow-hidden rounded-2xl border cursor-pointer transition-all duration-300 ${
          isPlayingThis
            ? "border-fuchsia-300/50 shadow-[0_0_30px_rgba(217,140,255,0.2)]"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        <div className="relative aspect-square overflow-hidden">
          <Artwork src={songCover} alt={song.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20" />

          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            whileHover={{ opacity: 1, scale: 1 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-xl border border-white/30">
              <Play className="h-5 w-5 fill-white text-white ml-0.5" />
            </div>
          </motion.div>

          {isPlayingThis && (
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/30">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-[3px] rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-400"
                  animate={{ scaleY: [0.4, 1, 0.6, 1, 0.8] }}
                  transition={{
                    duration: 0.7 + i * 0.12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3
                className={`truncate text-sm font-black ${
                  isPlayingThis ? "text-fuchsia-300" : "text-white"
                }`}
              >
                {song.title}
              </h3>
              <p className="truncate text-xs text-white/60 mt-1">{artistName}</p>
            </div>
            <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/80 backdrop-blur-md">
              #
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>
        </div>

        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{ background: accent }}
          initial={{ scaleX: 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </motion.div>
    );
  };

  const renderTracksForYou = () => {
    const displaySongs = songs.slice(0, 24);

    return (
      <motion.section className="mt-12 space-y-4" variants={containerVariants} initial="hidden" animate="show">
        <motion.div className="flex items-end justify-between" variants={fadeIn}>
          <div>
            <div className="flex items-center gap-2">
              <Disc3 className="h-4 w-4 text-cyan-300" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                Toàn bộ catalog
              </p>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Dành cho bạn</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">{songs.length} bài hát</span>
            {songs.length > 0 && (
              <motion.button
                type="button"
                onClick={playAllCatalog}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-950 shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Phát tất cả
              </motion.button>
            )}
          </div>
        </motion.div>

        {loading ? (
          <motion.div className="flex h-48 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]" variants={fadeIn}>
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-fuchsia-300" />{" "}
            Tuning the catalog...
          </motion.div>
        ) : catalogError ? (
          <motion.div
            role="alert"
            className="rounded-2xl border border-rose-300/25 bg-rose-300/[0.08] px-5 py-10 text-center text-sm text-rose-100"
            variants={fadeIn}
          >
            <p className="mb-2 font-semibold">Không thể tải bài hát lúc này</p>
            <p className="text-xs text-rose-200/70">{catalogError}</p>
            <motion.button
              type="button"
              onClick={() => setRetryToken((t) => t + 1)}
              className="mt-4 min-h-11 rounded-xl border border-rose-200/30 px-4 font-semibold hover:bg-rose-200/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Thử lại
            </motion.button>
          </motion.div>
        ) : displaySongs.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {displaySongs.map((song: any, index: number) => {
              const isPlayingThis =
                String(currentTrack?.id) === String(song.id);
              const artistName =
                typeof song.artist === "object"
                  ? song.artist?.name
                  : song.artist || "Nghệ sĩ";
              const genreName =
                song.genres?.slice(0, 2).join(" · ") || "Auraic";
              const songCover =
                song.image ||
                song.coverUrl ||
                "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=500&auto=format&fit=crop";

              return (
                <motion.div
                  key={song.id}
                  variants={scaleIn}
                  custom={index}
                  whileHover={{ x: 8 }}
                  onClick={() => playTrack(song, songs, "Discover")}
                  className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 cursor-pointer ${
                    isPlayingThis
                      ? "border-fuchsia-300/50 bg-fuchsia-300/10 shadow-[0_0_30px_rgba(217,140,255,0.15)]"
                      : "border-auraic-border bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/20"
                  }`}
                >
                  <motion.div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-fuchsia-500/10 via-transparent to-cyan-400/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative flex items-center gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <motion.div whileHover={{ scale: 1.08 }} transition={{ type: "spring", damping: 20, stiffness: 200 }}>
                        <Artwork src={songCover} alt={song.title} className="h-full w-full object-cover" />
                      </motion.div>
                      <motion.div className="absolute inset-0 flex items-center justify-center bg-black/40" initial={{ opacity: 0 }} whileHover={{ opacity: 1 }}>
                        <Play className="h-5 w-5 fill-white text-white ml-0.5" />
                      </motion.div>
                      {isPlayingThis && (
                        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="w-[3px] rounded-full bg-gradient-to-t from-cyan-400 to-fuchsia-400"
                              animate={{ scaleY: [0.4, 1, 0.6, 1, 0.8] }}
                              transition={{
                                duration: 0.7 + i * 0.12,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.1,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4
                        className={`truncate text-sm font-bold transition-colors ${
                          isPlayingThis
                            ? "text-fuchsia-300"
                            : "text-white group-hover:text-fuchsia-200"
                        }`}
                      >
                        {song.title}
                      </h4>
                      <p className="truncate text-xs text-white/50 mt-0.5">
                        {artistName}
                      </p>
                      <span className="inline-block mt-1.5 text-[10px] font-medium bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 rounded-md">
                        {genreName}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {song.duration && (
                        <span className="text-xs font-mono text-white/35 mr-1">
                          {Math.floor(song.duration / 60)}:
                          {String(song.duration % 60).padStart(2, "0")}
                        </span>
                      )}
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(song);
                        }}
                        className={`p-2 rounded-xl transition-all ${
                          isLiked(song.id)
                            ? "text-pink-400 bg-pink-500/10"
                            : "text-white/40 hover:text-pink-300 hover:bg-white/5"
                        }`}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.9 }}
                        title={isLiked(song.id) ? "Bỏ thích" : "Yêu thích"}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isLiked(song.id) ? "fill-current" : ""
                          }`}
                        />
                      </motion.button>
                      <TrackActionMenu track={song} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-12 text-center"
            variants={fadeIn}
          >
            <p className="text-white/50 text-sm font-medium">
              Không tìm thấy bài hát nào phù hợp
            </p>
            <p className="mt-1 text-xs text-white/35">
              Thử chọn thể loại khác hoặc xem tất cả.
            </p>
          </motion.div>
        )}
      </motion.section>
    );
  };

  const renderArtistSpotlight = () => {
    const displayArtists = artists.slice(0, 12);

    if (displayArtists.length === 0) return null;

    return (
      <motion.section className="mt-12" variants={containerVariants} initial="hidden" animate="show">
        <motion.div className="flex items-end justify-between" variants={fadeIn}>
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-300" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-purple-300">
                Nghệ sĩ nổi bật
              </p>
            </div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">
              Đang hot
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={() => scrollSlider(artistsRef, "left")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="h-4 w-4" />
            </motion.button>
            <motion.button
              type="button"
              onClick={() => scrollSlider(artistsRef, "right")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>

        <div
          ref={artistsRef}
          className="mt-6 flex gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2"
        >
          {displayArtists.map((artist: any, index: number) => {
            const avatar =
              artist.avatar ||
              artist.image ||
              "https://images.unsplash.com/photo-1519608487953-e999c86e7455?q=80&w=500&auto=format&fit=crop";
            const isHovered = artistHover === artist.id;

            return (
              <motion.div
                key={artist.id || index}
                variants={scaleIn}
                custom={index}
                className="relative flex shrink-0 flex-col items-center gap-3 snap-start"
                onMouseEnter={() => setArtistHover(String(artist.id))}
                onMouseLeave={() => setArtistHover(null)}
              >
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", damping: 20, stiffness: 200 }}
                >
                  <motion.div
                    className="absolute -inset-2 rounded-full opacity-0 blur-2xl transition-opacity duration-300"
                    style={{
                      background:
                        isHovered
                          ? "rgba(168, 85, 247, 0.5)"
                          : "rgba(6, 182, 212, 0.3)",
                    }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                  />
                  <div
                    className={`relative h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-full border-2 transition-all duration-300 ${
                      isHovered
                        ? "border-fuchsia-300/60 shadow-[0_0_30px_rgba(217,140,255,0.4)]"
                        : "border-white/20"
                    }`}
                  >
                    <Artwork
                      src={avatar}
                      alt={artist.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {isHovered && (
                    <motion.div
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <Play className="h-3 w-3 fill-black text-black ml-0.5" />
                      <span className="text-[10px] font-bold text-slate-950">
                        Phát
                      </span>
                    </motion.div>
                  )}
                </motion.div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white truncate max-w-[120px]">
                    {artist.name}
                  </p>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    Nghệ sĩ
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    );
  };

  return (
    <motion.div
      className="relative min-h-full overflow-y-auto scrollbar-none px-5 pb-36 pt-3 text-white sm:px-8 lg:px-12"
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={
        hoveredBento
          ? {
              background: `radial-gradient(circle at 50% 30%, ${moodBentoItems.find(m => m.title === hoveredBento)?.aura || "transparent"} 0%, transparent 60%)`,
              transition: "background 0.6s ease",
            }
          : undefined
      }
    >
      {currentImage && (
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute -left-20 top-10 h-80 w-80 rounded-full opacity-40 blur-[120px]"
            style={{
              backgroundImage: `url(${currentImage})`,
              backgroundSize: "cover",
            }}
            animate={{ opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-auraic-bg/60 to-auraic-bg" />
        </div>
      )}

      {renderHeroSlider()}
      {renderQuickVibeFilters()}
      {renderBentoGrid()}

      {curatedSectionDefs.map((section) => {
        const items = curatedTracks[section.key] || [];
        const featured = items.slice(0, 6);

        return (
          <motion.section key={section.key} className="mt-12 space-y-5" variants={containerVariants} initial="hidden" animate="show">
            <motion.div className="flex items-end justify-between" variants={fadeIn}>
              <div>
                <div className="flex items-center gap-2">
                  <section.icon className={`h-4 w-4 ${section.color}`} />
                  <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${section.color}`}>{section.title}</p>
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">{section.subtitle}</h2>
              </div>
              {featured.length > 0 && (
                <div className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    onClick={() => scrollSlider(section.key === "fresh" ? freshRef : trendingRef, "left")}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => scrollSlider(section.key === "fresh" ? freshRef : trendingRef, "right")}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                </div>
              )}
            </motion.div>

            {loading ? (
              <div className="flex h-40 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-fuchsia-300" />
              </div>
            ) : featured.length > 0 ? (
              <div
                ref={section.key === "fresh" ? freshRef : trendingRef}
                className="flex gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2"
              >
                {featured.map((song: any, index: number) => (
                  <div key={song.id} className="shrink-0 w-[180px] sm:w-[200px] snap-start">
                    {renderSquareCard(song, index, section.accent)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-12 text-center">
                <p className="text-white/50 text-sm font-medium">
                  Đang cập nhật nội dung
                </p>
                <p className="mt-1 text-xs text-white/35">
                  Thử tải lại trang sau vài giây.
                </p>
              </div>
            )}
          </motion.section>
        );
      })}

      {renderTracksForYou()}
      {renderArtistSpotlight()}
    </motion.div>
  );
}
