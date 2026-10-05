"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Heart,
  Radio,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Flame,
  Zap,
  Activity,
  Share2,
  Compass,
  Headphones,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { StreamEngineService, AuraicAudioAdapter } from "@/lib/sound-engine/client";
import { EngineTrack } from "@/types/sound-engine";
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
  const { playTrack, currentTrack, isPlaying, toggleLike, likedIds } = usePlayerStore();

  const [trendingTracks, setTrendingTracks] = useState<EngineTrack[]>([]);
  const [undergroundTracks, setUndergroundTracks] = useState<EngineTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());
  // Time theme
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
        greeting: "Khởi đầu ngày mới cùng âm nhạc bạn yêu thích",
        icon: Sun,
        meshClasses:
          "from-amber-500/25 via-orange-500/15 to-sky-500/20 shadow-[0_0_80px_rgba(245,158,11,0.2)]",
        accentColor: "#f59e0b",
        glowColor: "rgba(245, 158, 11, 0.4)",
      };
    } else if (currentHour >= 12 && currentHour < 18) {
      return {
        label: "Buổi Chiều",
        greeting: "Nạp năng lượng sáng tạo với âm nhạc mới",
        icon: Sunset,
        meshClasses:
          "from-violet-600/30 via-fuchsia-500/20 to-cyan-500/25 shadow-[0_0_80px_rgba(168,85,247,0.25)]",
        accentColor: "#a855f7",
        glowColor: "rgba(168, 85, 247, 0.45)",
      };
    } else {
      return {
        label: "Buổi Tối & Đêm",
        greeting: "Không gian tĩnh mịch cho những giai điệu dịu êm",
        icon: Moon,
        meshClasses:
          "from-indigo-900/40 via-purple-900/25 to-cyan-900/30 shadow-[0_0_80px_rgba(99,102,241,0.3)]",
        accentColor: "#6366f1",
        glowColor: "rgba(99, 102, 241, 0.45)",
      };
    }
  }, [currentHour]);

  // Load Engine Data
  const loadEngineContent = useCallback(async () => {
    setLoading(true);
    try {
      const [trending, underground] = await Promise.all([
        StreamEngineService.fetchTrendingTracks(10),
        StreamEngineService.fetchUndergroundTracks(12),
      ]);
      setTrendingTracks(trending);
      setUndergroundTracks(underground);
    } catch (err) {
      console.error("[HomePage] Error loading engine content:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEngineContent();
  }, [loadEngineContent]);

  const TimeIcon = timeTheme.icon;

  const handlePlayEngineTrack = (track: EngineTrack, pool: EngineTrack[]) => {
    const playerTrack = AuraicAudioAdapter.toPlayerTrack(track);
    const playerPool = pool.map((t) => AuraicAudioAdapter.toPlayerTrack(t));
    playTrack(playerTrack, playerPool, "Auraic Sound Engine");
  };

  return (
    <div className="min-h-full px-5 pb-36 pt-4 text-white sm:px-8 lg:px-12 space-y-12">
      {/* ========================================================= */}
      {/* 1. HERO BANNER: SPATIAL 3D BENTO GLASS                    */}
      {/* ========================================================= */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`relative overflow-hidden rounded-[36px] border border-white/20 bg-gradient-to-br p-6 sm:p-10 lg:p-12 shadow-[0_25px_60px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.25)] transition-colors duration-1000 ${timeTheme.meshClasses}`}
      >
        {/* Floating Ambient Spheres */}
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -35, 25, 0],
            scale: [1, 1.18, 0.92, 1],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-16 -left-16 h-72 w-72 rounded-full bg-gradient-to-tr from-violet-600/40 via-fuchsia-500/30 to-cyan-400/20 shadow-[0_0_60px_rgba(168,85,247,0.5)] blur-[70px]"
        />
        <motion.div
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 40, -25, 0],
            scale: [1, 1.15, 0.95, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -bottom-16 right-8 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-400/30 via-indigo-500/20 to-pink-500/20 shadow-[0_0_80px_rgba(6,182,212,0.4)] blur-[80px]"
        />

        <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-black/40 px-4 py-1.5 backdrop-blur-xl shadow-inner">
              <TimeIcon className="h-4 w-4 text-cyan-300 animate-pulse" />
              <span className="text-xs font-semibold tracking-wide uppercase text-white/90">
                {timeTheme.label} • Auraic Sound Hub
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl text-white">
              Âm Thanh Mở.{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-indigo-200 to-pink-300 bg-clip-text text-transparent">
                Khám Phá Âm Nhạc.
              </span>
            </h1>

            <p className="text-sm font-medium text-white/75 sm:text-base leading-relaxed">
              {timeTheme.greeting}. Khám phá và nghe các bài hát qua Sound Engine.
            </p>

            {/* Quick CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-cyan-300 transition-all shadow-lg hover:scale-105 cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                Khám Phá Matrix Thể Loại
              </Link>
              <Link
                href="/stations"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs tracking-wider backdrop-blur-md transition-all cursor-pointer"
              >
                <Radio className="w-4 h-4 text-cyan-300" />
                Ambient Stations
              </Link>
            </div>
          </div>

          {/* Provider badge */}
          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-black/50 px-4 py-3 backdrop-blur-2xl shadow-2xl">
              <div className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-left">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                  Sound Engine
                </div>
                <div className="text-[10px] text-white/50">
                  Tìm kiếm và phát nhạc chất lượng cao
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-1 text-[11px] font-mono text-cyan-200">
              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sound Engine streams</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ========================================================= */}
      {/* 2. TRENDING MOTION CAROUSEL (Top 10 Global 3D Glass Cards) */}
      {/* ========================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-red-500/20 border border-amber-500/30">
              <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                Top 10 Global Trends
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white/95">
                Trending Motion Radar
              </h2>
            </div>
          </div>
          <span className="hidden sm:inline-block text-xs font-mono text-white/40">
            Kéo ngang để xem thêm • 3D Glass Cards
          </span>
        </div>

        {loading ? (
          <div className="flex gap-5 overflow-hidden py-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-72 h-96 shrink-0 rounded-3xl border border-white/10 bg-white/[0.03] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-6 pt-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x snap-mandatory">
            {trendingTracks.map((track, index) => {
              const playerTrack = AuraicAudioAdapter.toPlayerTrack(track);
              const isCurrent = String(currentTrack?.id) === String(playerTrack.id);
              const isLiked = likedIds.some((id) => String(id) === String(playerTrack.id));
              const artworkUrl =
                track.artwork?.["1000x1000"] ||
                track.artwork?.["480x480"] ||
                track.artwork?.["150x150"] ||
                "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop";

              return (
                <motion.div
                  key={track.id}
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-72 shrink-0 snap-start"
                >
                  <TiltCard
                    glowColor="rgba(168, 85, 247, 0.4)"
                    depthZ={24}
                    className="relative group h-full rounded-3xl p-5 border border-white/15 bg-gradient-to-b from-white/[0.08] to-black/40 backdrop-blur-2xl shadow-[0_15px_35px_rgba(0,0,0,0.6)] cursor-pointer flex flex-col justify-between"
                    onClick={() => handlePlayEngineTrack(track, trendingTracks)}
                  >
                    {/* Rank Badge */}
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-1 px-3 py-1 rounded-xl bg-black/60 border border-white/20 backdrop-blur-md">
                      <span className="text-xs font-black font-mono text-amber-400">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Provider badge */}
                    <div className="absolute top-4 right-4 z-20 px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[9px] font-mono font-bold text-emerald-300 backdrop-blur-md">
                      Sound Engine
                    </div>

                    {/* Artwork with 3D Pop */}
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-4 mt-8">
                      <Artwork
                        src={artworkUrl}
                        alt={track.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-cyan-400 to-violet-500 p-0.5 shadow-[0_0_25px_rgba(6,182,212,0.8)]">
                          <div className="h-full w-full rounded-full bg-black/80 flex items-center justify-center">
                            {isCurrent && isPlaying ? (
                              <Pause className="w-6 h-6 text-white" />
                            ) : (
                              <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Track Info */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-base text-white truncate group-hover:text-cyan-300 transition-colors">
                        {track.title}
                      </h3>
                      <Link
                        href={`/artist/${track.user?.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-white/60 truncate hover:text-white transition-colors flex items-center gap-1"
                      >
                        <span>{track.user?.name || track.user?.handle}</span>
                        {track.user?.is_verified && (
                          <span className="text-[10px] text-cyan-400 font-bold">✓</span>
                        )}
                      </Link>

                      {/* Provider and library action */}
                      <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/10 font-mono">
                        <span>Sound Engine</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(playerTrack);
                          }}
                          className="text-white/40 hover:text-rose-400 transition"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isLiked ? "fill-rose-500 text-rose-500" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {/* Track details link */}
                      <div className="pt-1">
                        <Link
                          href={`/track/${track.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-indigo-300 hover:text-indigo-100 flex items-center gap-1 font-mono tracking-wide"
                        >
                          <span>Xem thông tin bài hát →</span>
                        </Link>
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 3. UNDERGROUND RADAR (Indie & Electronic Gems)            */}
      {/* ========================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">
                Hidden Gems & Rising Creators
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white/95">
                Underground Radar
              </h2>
            </div>
          </div>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {undergroundTracks.map((track) => {
              const playerTrack = AuraicAudioAdapter.toPlayerTrack(track);
              const isCurrent = String(currentTrack?.id) === String(playerTrack.id);
              const isLiked = likedIds.some((id) => String(id) === String(playerTrack.id));
              const artworkUrl =
                track.artwork?.["480x480"] ||
                track.artwork?.["150x150"] ||
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=500&auto=format&fit=crop";

              return (
                <TiltCard
                  key={track.id}
                  glowColor="rgba(6, 182, 212, 0.35)"
                  depthZ={16}
                  onClick={() => handlePlayEngineTrack(track, undergroundTracks)}
                  className="group p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] hover:border-cyan-500/30 backdrop-blur-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Artwork */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl shadow-lg border border-white/10">
                      <Artwork
                        src={artworkUrl}
                        alt={track.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-5 h-5 text-cyan-300" />
                        ) : (
                          <Play className="w-5 h-5 fill-white text-white" />
                        )}
                      </div>
                    </div>

                    {/* Track info */}
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`truncate text-sm font-bold transition-colors ${
                          isCurrent ? "text-cyan-300" : "text-white group-hover:text-cyan-200"
                        }`}
                      >
                        {track.title}
                      </h3>
                      <Link
                        href={`/artist/${track.user?.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="truncate text-xs text-white/50 hover:text-white block mt-0.5"
                      >
                        {track.user?.name}
                      </Link>
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/40 font-mono">
                        <span className="rounded bg-white/10 px-1.5 py-0.2">
                          {Math.floor(track.duration / 60)}:
                          {String(Math.floor(track.duration % 60)).padStart(2, "0")}
                        </span>
                        <span>•</span>
                        <span className="truncate text-cyan-300/80">
                          {track.genre || "Underground"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(playerTrack);
                        }}
                        className="p-1.5 text-white/40 hover:text-rose-400 transition"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isLiked ? "fill-rose-500 text-rose-500" : ""
                          }`}
                        />
                      </button>
                      <Link
                        href={`/track/${track.id}`}
                        onClick={(e) => e.stopPropagation()}
                        title="Chi tiết bài hát"
                        className="text-[10px] text-white/40 hover:text-cyan-300"
                      >
                        ℹ
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
