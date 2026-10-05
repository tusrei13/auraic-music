"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  Heart,
  Flame,
  Zap,
  SkipBack,
  SkipForward,
  Shuffle,
  Maximize2,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { StreamEngineService, AuraicAudioAdapter } from "@/lib/sound-engine/client";
import { EngineTrack } from "@/types/sound-engine";
import Artwork from "@/components/Artwork";
import RetroTurntableDeck from "@/components/ui/RetroTurntableDeck";
import BlockyWaveform from "@/components/ui/BlockyWaveform";
import PixelBadge from "@/components/ui/PixelBadge";
import PillFilter from "@/components/ui/PillFilter";
import RetroCard from "@/components/ui/RetroCard";

const CATEGORIES = [
  "Classic",
  "90s",
  "New",
  "Instrumental",
  "Modern pop",
  "Ambient",
  "Synthwave",
  "Lofi",
];

const FEATURED_CARDS = [
  {
    id: "fc-1",
    title: "Daily Chaos",
    artist: "Emily Bryan",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
    query: "daily chaos indie",
  },
  {
    id: "fc-2",
    title: "Simple Things",
    artist: "Ryan Poppin",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
    query: "simple things acoustic",
  },
  {
    id: "fc-3",
    title: "Not so good",
    artist: "Bryan Thomas",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop",
    query: "not so good chill",
  },
];

const FAVORITE_PLAYLISTS = [
  {
    id: "pl-1",
    title: "Best of Eren",
    trackCount: 32,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
    query: "anime epic soundtrack",
  },
  {
    id: "pl-2",
    title: "Arcade Neon Synth",
    trackCount: 24,
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop",
    query: "synthwave cyberpunk arcade",
  },
  {
    id: "pl-3",
    title: "Midnight Lo-Fi Chill",
    trackCount: 48,
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop",
    query: "lofi hip hop chill beats",
  },
  {
    id: "pl-4",
    title: "Retro 8-Bit Hi-Fi",
    trackCount: 18,
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop",
    query: "8-bit chiptune retro",
  },
];

export default function ExplorePage() {
  const {
    playTrack,
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleShuffle,
    isShuffle,
    toggleLike,
    likedIds,
  } = usePlayerStore();

  const [trendingTracks, setTrendingTracks] = useState<EngineTrack[]>([]);
  const [undergroundTracks, setUndergroundTracks] = useState<EngineTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Classic");
  const [deckTime, setDeckTime] = useState(114); // 1:54
  const deckDuration = 215; // 3:35

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
      console.error("[ExplorePage] Error loading engine content:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEngineContent();
  }, [loadEngineContent]);

  // Simulate progress on hero deck when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setDeckTime((prev) => (prev >= deckDuration ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, deckDuration]);

  const handlePlayEngineTrack = (track: EngineTrack, pool: EngineTrack[]) => {
    const playerTrack = AuraicAudioAdapter.toPlayerTrack(track);
    const playerPool = pool.map((t) => AuraicAudioAdapter.toPlayerTrack(t));
    playTrack(playerTrack, playerPool, "Auraic Sound Engine");
  };

  const handlePlaySearchQuery = async (query: string, title: string) => {
    try {
      const res = await fetch(`/api/sound-engine/search?q=${encodeURIComponent(query)}&type=song`);
      if (res.ok) {
        const data = await res.json();
        if (data.songs && data.songs.length > 0) {
          const pool = data.songs.map(AuraicAudioAdapter.toPlayerTrack);
          playTrack(pool[0], pool, title);
        }
      }
    } catch (e) {
      console.error("Failed to play playlist query:", e);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const activeTitle = currentTrack?.title || "The Suffering";
  const activeArtist = typeof currentTrack?.artist === "object"
    ? currentTrack?.artist?.name
    : currentTrack?.artist || "Coheed and Cambria";
  const activeCover = currentTrack?.image || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop";

  const isLiked = currentTrack
    ? likedIds.some((id) => String(id) === String(currentTrack.id))
    : false;

  return (
    <div className="min-h-full px-4 pb-36 pt-4 text-white sm:px-8 lg:px-12 space-y-14">
      {/* ========================================================= */}
      {/* 1. HERO 2D RETRO HARDWARE DECK & CATEGORIES (Reference)    */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden rounded-[36px] border-2 border-white/15 bg-[#0d0f1b]/95 p-5 sm:p-8 lg:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.2)]">
        
        {/* Subtle Screws on the Outer Stage Frame */}
        <div className="retro-screw absolute top-4 left-4" />
        <div className="retro-screw absolute top-4 right-4" />
        <div className="retro-screw absolute bottom-4 left-4" />
        <div className="retro-screw absolute bottom-4 right-4" />

        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-purple-600/20 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-500/15 blur-[90px]" />

        <div className="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12 items-start">
          
          {/* ================= LEFT COLUMN: TURNTABLE & CONTROLS ================= */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* The 2D Hardware Turntable Console */}
            <RetroTurntableDeck
              isPlaying={isPlaying}
              onTogglePlay={togglePlay}
              trackTitle={activeTitle}
              artistName={activeArtist}
              coverImage={activeCover}
            />

            {/* Track Metadata & High-Contrast Badges */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-pixel text-2xl sm:text-3xl font-bold tracking-tight text-white truncate drop-shadow-md">
                    {activeTitle}
                  </h2>
                  <p className="font-arcade text-xs text-white/60 tracking-wider truncate mt-0.5">
                    {activeArtist}
                  </p>
                </div>

                {/* Like Count Speech Bubble Badge (+ 392) */}
                <PixelBadge
                  count={isLiked ? 393 : 392}
                  variant="bubble"
                  onClick={() => currentTrack && toggleLike(currentTrack)}
                  className="shrink-0"
                />
              </div>

              {/* Genre / Category Tag */}
              <div className="flex items-center gap-2 pt-1">
                <span className="rounded-full border border-white bg-white text-black font-pixel font-bold px-3.5 py-0.5 text-xs shadow-sm">
                  {selectedCategory}
                </span>
                <span className="font-arcade text-[10px] text-cyan-300/80 px-2 py-0.5 rounded-full border border-cyan-400/30 bg-cyan-950/40">
                  HI-FI 33⅓ RPM
                </span>
              </div>

              {/* Blocky Pixelated Waveform Progress Bar */}
              <div className="flex items-center gap-3 pt-2 font-arcade text-xs text-white/80">
                <span className="w-10 text-right font-arcade text-[11px] text-white/70">
                  {formatTimer(deckTime)}
                </span>
                <div className="flex-1">
                  <BlockyWaveform
                    currentTime={deckTime}
                    duration={deckDuration}
                    isPlaying={isPlaying}
                    onSeek={(time) => setDeckTime(time)}
                    barCount={32}
                    glowColor="white"
                  />
                </div>
                <span className="w-10 text-left font-arcade text-[11px] text-white/70">
                  {formatTimer(deckDuration)}
                </span>
              </div>

              {/* Arcade Transport Controls */}
              <div className="flex items-center justify-between pt-3 px-2">
                <button
                  type="button"
                  onClick={() => usePlayerStore.getState().toggleLyrics()}
                  title="Mở rộng visualizer"
                  className="p-2 text-white/60 hover:text-white transition-all cursor-pointer hover:scale-110 active:scale-95"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={prevTrack}
                  title="Bài trước"
                  className="p-2 text-white/70 hover:text-white transition-all cursor-pointer hover:scale-110 active:scale-95"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>

                {/* Large Circular White Button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  title={isPlaying ? "Tạm dừng" : "Phát"}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.7),0_0_15px_rgba(168,85,247,0.5)] border-2 border-white cursor-pointer hover:scale-110 active:scale-95 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-black text-black" />
                  ) : (
                    <Play className="w-6 h-6 fill-black text-black ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={nextTrack}
                  title="Bài tiếp"
                  className="p-2 text-white/70 hover:text-white transition-all cursor-pointer hover:scale-110 active:scale-95"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>

                <button
                  type="button"
                  onClick={toggleShuffle}
                  title="Trộn bài"
                  className={`p-2 transition-all cursor-pointer hover:scale-110 active:scale-95 ${
                    isShuffle ? "text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "text-white/60 hover:text-white"
                  }`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: MUSIC CATEGORIES & PLAYLISTS ================= */}
          <div className="lg:col-span-7 flex flex-col space-y-9">
            
            {/* 1. MUSIC CATEGORIES HEADER & PILLS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-pixel text-3xl sm:text-4xl font-black text-white tracking-tight">
                    Music Categories
                  </h1>
                </div>
              </div>

              {/* Category Filter Pills (Reference Image Style) */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <PillFilter
                    key={cat}
                    label={cat}
                    active={selectedCategory === cat}
                    onClick={() => setSelectedCategory(cat)}
                  />
                ))}
              </div>

              {/* 3 Featured Category Cards (Rounded Frame With Pixel Typography) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {FEATURED_CARDS.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handlePlaySearchQuery(card.query, card.title)}
                    className="group cursor-pointer select-none space-y-2.5"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[26px] border-2 border-white/20 bg-neutral-900 shadow-xl transition-all duration-300 group-hover:border-purple-400/80 group-hover:scale-[1.03]">
                      <Artwork
                        src={card.image}
                        alt={card.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />
                      
                      {/* Play overlay badge */}
                      <div className="absolute bottom-3 right-3 h-10 w-10 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-75 group-hover:scale-100">
                        <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-pixel text-sm font-bold text-white tracking-wide group-hover:text-cyan-300 transition-colors">
                        {card.title}
                      </h3>
                      <p className="font-arcade text-[11px] text-white/50 tracking-wider">
                        by {card.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. FAVORITE PLAYLISTS (4) */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h2 className="font-pixel text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Favorite Playlists ({FAVORITE_PLAYLISTS.length})
                </h2>
                <Link
                  href="/library"
                  className="font-pixel text-xs text-white/50 hover:text-white transition-colors"
                >
                  Thư viện →
                </Link>
              </div>

              {/* Playlist List Items (Reference Image: Rounded Square + Circular Play Outline) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {FAVORITE_PLAYLISTS.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => handlePlaySearchQuery(pl.query, pl.title)}
                    className="group flex items-center justify-between gap-3.5 p-3 rounded-2xl border-2 border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30 transition-all cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/20 shadow-md">
                        <Artwork
                          src={pl.image}
                          alt={pl.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-pixel text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                          {pl.title}
                        </h4>
                        <p className="font-arcade text-[11px] text-white/50 tracking-wider mt-0.5">
                          {pl.trackCount} songs in this list
                        </p>
                      </div>
                    </div>

                    {/* Circular Outline Play Button */}
                    <div className="shrink-0 h-10 w-10 rounded-full border-2 border-white/30 flex items-center justify-center group-hover:border-white group-hover:bg-white group-hover:text-black text-white transition-all shadow-sm">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. TRENDING MOTION RADAR (Top 10 Retro Arcade Cards)      */}
      {/* ========================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30">
              <Flame className="w-5 h-5 text-amber-400 animate-bounce" />
            </div>
            <div>
              <span className="font-arcade text-[10px] uppercase tracking-widest text-amber-400">
                Top 10 Global Trends
              </span>
              <h2 className="font-pixel text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Trending Motion Radar
              </h2>
            </div>
          </div>
          <span className="hidden sm:inline-block font-arcade text-xs text-white/40">
            Kéo ngang để xem thêm • 8-Bit Hi-Fi Cards
          </span>
        </div>

        {loading ? (
          <div className="flex gap-5 overflow-hidden py-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-72 h-96 shrink-0 rounded-[28px] border-2 border-white/10 bg-white/[0.03] animate-pulse"
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
                <div
                  key={track.id}
                  className="w-72 shrink-0 snap-start select-none"
                >
                  <RetroCard
                    screws={true}
                    onClick={() => handlePlayEngineTrack(track, trendingTracks)}
                    className="p-5 flex flex-col justify-between h-full"
                  >
                    {/* Rank Badge & Sound Engine Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-black/70 border border-amber-400/40">
                        <span className="font-arcade text-xs font-bold text-amber-400">
                          #{index + 1}
                        </span>
                      </div>
                      <span className="font-arcade text-[9px] font-bold text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-400/30 bg-cyan-950/50">
                        SOUND ENGINE
                      </span>
                    </div>

                    {/* Artwork with Retro Rounded Frame */}
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-white/15 my-4 group">
                      <Artwork
                        src={artworkUrl}
                        alt={track.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="h-14 w-14 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.8)] border-2 border-white">
                          {isCurrent && isPlaying ? (
                            <Pause className="w-6 h-6 fill-black text-black" />
                          ) : (
                            <Play className="w-6 h-6 fill-black text-black ml-0.5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Track Info */}
                    <div className="space-y-2">
                      <h3 className="font-pixel text-base font-bold text-white truncate hover:text-cyan-300 transition-colors">
                        {track.title}
                      </h3>
                      <Link
                        href={`/artist/${track.user?.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-arcade text-xs text-white/60 truncate hover:text-white transition-colors flex items-center gap-1"
                      >
                        <span>{track.user?.name || track.user?.handle}</span>
                        {track.user?.is_verified && (
                          <span className="text-[10px] text-cyan-400 font-bold">✓</span>
                        )}
                      </Link>

                      {/* Actions & Like */}
                      <div className="flex items-center justify-between text-[11px] text-white/50 pt-2 border-t border-white/10 font-arcade">
                        <Link
                          href={`/track/${track.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-cyan-300 transition-colors"
                        >
                          Chi tiết →
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(playerTrack);
                          }}
                          className="p-1 text-white/50 hover:text-rose-400 transition cursor-pointer"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isLiked ? "fill-rose-500 text-rose-500" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </RetroCard>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 3. UNDERGROUND RADAR (Rising Gems & Synthwave)             */}
      {/* ========================================================= */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/30">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="font-arcade text-[10px] uppercase tracking-widest text-cyan-400">
                Hidden Gems & Rising Creators
              </span>
              <h2 className="font-pixel text-2xl sm:text-3xl font-bold tracking-tight text-white">
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
                className="h-28 animate-pulse rounded-2xl border-2 border-white/10 bg-white/[0.03]"
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
                <div
                  key={track.id}
                  onClick={() => handlePlayEngineTrack(track, undergroundTracks)}
                  className="group p-3.5 rounded-2xl border-2 border-white/10 bg-[#10121d]/85 hover:border-purple-500/40 backdrop-blur-xl transition-all cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Artwork */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/15 shadow-lg">
                      <Artwork
                        src={artworkUrl}
                        alt={track.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 fill-white text-white" />
                        )}
                      </div>
                    </div>

                    {/* Track info */}
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`truncate font-pixel text-sm font-bold transition-colors ${
                          isCurrent ? "text-cyan-300" : "text-white group-hover:text-cyan-200"
                        }`}
                      >
                        {track.title}
                      </h3>
                      <Link
                        href={`/artist/${track.user?.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="truncate font-arcade text-xs text-white/50 hover:text-white block mt-0.5"
                      >
                        {track.user?.name}
                      </Link>
                      <div className="mt-1.5 flex items-center gap-2 font-arcade text-[10px] text-white/40">
                        <span className="rounded bg-white/10 px-1.5 py-0.2">
                          {Math.floor(track.duration / 60)}:
                          {String(Math.floor(track.duration % 60)).padStart(2, "0")}
                        </span>
                        <span>•</span>
                        <span className="truncate text-cyan-300">
                          {track.genre || "Indie"}
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
                        className="font-arcade text-[10px] text-white/40 hover:text-cyan-300"
                      >
                        ℹ
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
