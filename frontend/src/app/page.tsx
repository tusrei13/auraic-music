"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  Sparkles,
  Heart,
  Radio,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Headphones,
  Disc3,
  SlidersHorizontal,
} from "lucide-react";
import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { getJamendoTracks, JamendoSong } from "@/lib/api";
import Artwork from "@/components/Artwork";
import TiltCard from "@/components/ui/TiltCard";

interface TimeOfDayTheme {
  label: string;
  greeting: string;
  icon: React.ComponentType<{ className?: string }>;
  meshClasses: string;
  accentColor: string;
  glowColor: string;
}

export default function HomePage() {
  const { playTrack, playMix, currentTrack, isPlaying, toggleLike, likedIds } =
    usePlayerStore();

  const [recentPicks, setRecentPicks] = useState<JamendoSong[]>([]);
  const [lofiCarousel, setLofiCarousel] = useState<JamendoSong[]>([]);
  const [focusCarousel, setFocusCarousel] = useState<JamendoSong[]>([]);
  const [nightCarousel, setNightCarousel] = useState<JamendoSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());

  // Determine Time of Day Theme
  useEffect(() => {
    const updateHour = () => setCurrentHour(new Date().getHours());
    updateHour();
    const interval = setInterval(updateHour, 60000);
    return () => clearInterval(interval);
  }, []);

  const timeTheme: TimeOfDayTheme = useMemo(() => {
    if (currentHour >= 5 && currentHour < 12) {
      return {
        label: "Buổi Sáng",
        greeting: "Khởi đầu ngày mới với giai điệu thanh khiết",
        icon: Sun,
        meshClasses:
          "from-amber-500/25 via-orange-500/15 to-sky-500/20 shadow-[0_0_80px_rgba(245,158,11,0.2)]",
        accentColor: "#f59e0b",
        glowColor: "rgba(245, 158, 11, 0.4)",
      };
    } else if (currentHour >= 12 && currentHour < 18) {
      return {
        label: "Buổi Chiều",
        greeting: "Nạp năng lượng tích cực với dải âm hoàng hôn",
        icon: Sunset,
        meshClasses:
          "from-violet-600/30 via-fuchsia-500/20 to-cyan-500/25 shadow-[0_0_80px_rgba(168,85,247,0.25)]",
        accentColor: "#a855f7",
        glowColor: "rgba(168, 85, 247, 0.45)",
      };
    } else {
      return {
        label: "Buổi Tối & Đêm",
        greeting: "Không gian tĩnh mịch cho tâm hồn thưởng âm",
        icon: Moon,
        meshClasses:
          "from-indigo-900/40 via-purple-900/25 to-cyan-900/30 shadow-[0_0_80px_rgba(99,102,241,0.3)]",
        accentColor: "#6366f1",
        glowColor: "rgba(99, 102, 241, 0.45)",
      };
    }
  }, [currentHour]);

  // Load Curated Jamendo Streams
  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const [picks, lofi, focus, synth] = await Promise.all([
        getJamendoTracks({ limit: 6, tags: "ambient chillout" }).catch(() => []),
        getJamendoTracks({ limit: 10, tags: "lofi hiphop" }).catch(() => []),
        getJamendoTracks({ limit: 10, tags: "piano classical focus" }).catch(() => []),
        getJamendoTracks({ limit: 10, tags: "synthwave electronic night" }).catch(() => []),
      ]);

      setRecentPicks(picks);
      setLofiCarousel(lofi);
      setFocusCarousel(focus);
      setNightCarousel(synth);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const TimeIcon = timeTheme.icon;

  return (
    <div className="min-h-full px-5 pb-36 pt-4 text-white sm:px-8 lg:px-12 space-y-12">
      {/* ========================================================= */}
      {/* 1. HEADER: REALTIME MESH GRADIENT BANNER                 */}
      {/* ========================================================= */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`relative overflow-hidden rounded-[36px] border border-white/15 bg-gradient-to-br p-6 sm:p-10 lg:p-12 backdrop-blur-3xl transition-colors duration-1000 ${timeTheme.meshClasses}`}
      >
        {/* Animated Mesh Fluid Orbs */}
        <motion.div
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-violet-500/30 blur-[90px] pointer-events-none"
        />
        <motion.div
          animate={{
            x: [0, -60, 40, 0],
            y: [0, 50, -30, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 right-10 h-96 w-96 rounded-full bg-cyan-400/25 blur-[100px] pointer-events-none"
        />
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.9, 1.05, 0.9],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-[80px] pointer-events-none"
        />

        <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
              <TimeIcon className="h-4 w-4 text-cyan-300 animate-pulse" />
              <span className="text-white/90">{timeTheme.label}</span>
              <span className="text-white/40">•</span>
              <span className="font-mono text-cyan-300">
                {String(new Date().getHours()).padStart(2, "0")}:
                {String(new Date().getMinutes()).padStart(2, "0")}
              </span>
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-6xl sm:leading-[1.08]">
              Trải nghiệm âm thanh <br />
              <span className="bg-gradient-to-r from-white via-violet-200 to-cyan-300 bg-clip-text text-transparent">
                Audiophile Không Giới Hạn.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-white/65 leading-relaxed">
              {timeTheme.greeting}. Không gian tinh gọn, chất âm trung thực với
              công nghệ mô phỏng trường âm độc bản.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => recentPicks.length > 0 && playMix(recentPicks, "Auraic Flow")}
              className="flex items-center gap-2.5 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-black shadow-[0_0_35px_rgba(255,255,255,0.4)] transition hover:bg-neutral-100"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Khởi động luồng nhạc</span>
            </motion.button>
            <a
              href="/stations"
              className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.07] px-5 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-md transition hover:bg-white/[0.14]"
            >
              <Radio className="h-4 w-4 text-cyan-300" />
              <span>Ambient Studio</span>
            </a>
          </div>
        </div>
      </motion.header>

      {/* ========================================================= */}
      {/* 2. QUICK PICK GRID: 3D PARALLAX TILT + GLOW NEON          */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-violet-400">
              Personalized Audio
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Gợi ý dành cho bạn</h2>
          </div>
          <span className="text-xs text-white/40 hidden sm:inline">
            Tương tác 3D Parallax Tilt & Neon Glow
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentPicks.map((track) => {
              const isCurrent = currentTrack?.id === track.id;
              const isLiked = likedIds.includes(track.id);

              return (
                <TiltCard
                  key={track.id}
                  glowColor={timeTheme.glowColor}
                  onClick={() => playTrack(track, recentPicks)}
                  className="group p-3.5"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Artwork Container */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl shadow-lg border border-white/10">
                      <Artwork
                        src={track.image}
                        alt={track.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Play overlay button */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {isCurrent && isPlaying ? (
                          <div className="flex gap-0.5 items-end h-4">
                            <span className="w-1 bg-cyan-300 animate-pulse h-4 rounded-full" />
                            <span className="w-1 bg-violet-400 animate-pulse h-2.5 rounded-full" />
                            <span className="w-1 bg-pink-400 animate-pulse h-3 rounded-full" />
                          </div>
                        ) : (
                          <Play className="h-5 w-5 fill-white text-white drop-shadow-md" />
                        )}
                      </div>
                    </div>

                    {/* Track info */}
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`truncate text-sm font-bold transition-colors ${
                          isCurrent ? "text-cyan-300" : "text-white group-hover:text-violet-200"
                        }`}
                      >
                        {track.title}
                      </h3>
                      <p className="truncate text-xs text-white/50 mt-0.5">
                        {typeof track.artist === "object" ? track.artist.name : track.artist}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/40">
                        <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono">
                          {Math.floor(track.duration / 60)}:
                          {String(Math.floor(track.duration % 60)).padStart(2, "0")}
                        </span>
                        <span>•</span>
                        <span className="truncate">
                          {track.genres?.[0] || "Audiophile"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(track);
                      }}
                      className="rounded-full p-2 text-white/40 transition hover:scale-110 hover:text-rose-400"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isLiked ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                    </button>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 3. CURATED CAROUSELS: JAMENDO API WITH QUICK PLAY SCALE   */}
      {/* ========================================================= */}
      {/* Carousel 1: Lofi & Chillout Beats */}
      <CarouselRow
        title="Lofi & Ambient Sanctuary"
        subtitle="Âm sắc dịu êm giúp bạn xoa dịu tâm trí"
        tracks={lofiCarousel}
        onPlayTrack={(track) => playTrack(track, lofiCarousel)}
      />

      {/* Carousel 2: Deep Focus & Piano */}
      <CarouselRow
        title="Deep Focus & Piano Chamber"
        subtitle="Không gian tập trung tuyệt đối cho công việc sáng tạo"
        tracks={focusCarousel}
        onPlayTrack={(track) => playTrack(track, focusCarousel)}
      />

      {/* Carousel 3: Nightfall Synthwave */}
      <CarouselRow
        title="Midnight Pulse & Synthwave"
        subtitle="Dòng năng lượng điện tử lấp lánh trong màn đêm"
        tracks={nightCarousel}
        onPlayTrack={(track) => playTrack(track, nightCarousel)}
      />
    </div>
  );
}

// =========================================================
// REUSABLE HORIZONTAL CAROUSEL COMPONENT WITH QUICK PLAY
// =========================================================
interface CarouselRowProps {
  title: string;
  subtitle: string;
  tracks: JamendoSong[];
  onPlayTrack: (track: JamendoSong) => void;
}

function CarouselRow({ title, subtitle, tracks, onPlayTrack }: CarouselRowProps) {
  const { currentTrack, isPlaying } = usePlayerStore();

  if (!tracks || tracks.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white/95">{title}</h2>
          <p className="text-xs text-white/50">{subtitle}</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none scroll-smooth">
        {tracks.map((track) => {
          const isCurrent = currentTrack?.id === track.id;

          return (
            <div
              key={track.id}
              onClick={() => onPlayTrack(track)}
              className="group relative w-44 sm:w-48 shrink-0 cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-white/25 hover:bg-white/[0.07] hover:shadow-[0_15px_35px_rgba(0,0,0,0.5)]"
            >
              {/* Cover Art */}
              <div className="relative aspect-square w-full overflow-hidden rounded-xl shadow-md">
                <Artwork
                  src={track.image}
                  alt={track.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                />

                {/* Smooth Scale-Up Quick Play Button */}
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayTrack(track);
                  }}
                  className="absolute bottom-2.5 right-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-violet-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.7)] opacity-0 translate-y-3 scale-75 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100"
                  aria-label="Phát ngay"
                >
                  {isCurrent && isPlaying ? (
                    <Pause className="h-4 w-4 fill-white" />
                  ) : (
                    <Play className="h-4 w-4 fill-white ml-0.5" />
                  )}
                </motion.button>
              </div>

              {/* Title & Artist */}
              <div className="mt-3">
                <h3
                  className={`truncate text-sm font-semibold transition-colors ${
                    isCurrent ? "text-cyan-300" : "text-white/90 group-hover:text-white"
                  }`}
                >
                  {track.title}
                </h3>
                <p className="mt-0.5 truncate text-xs text-white/50">
                  {typeof track.artist === "object" ? track.artist.name : track.artist}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
