"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  CloudRain,
  Disc,
  Waves,
  Sparkles,
  Play,
  Pause,
  Sliders,
  Moon,
  Leaf,
  Compass,
  Search,
  RefreshCw,
  Heart,
  Volume2,
} from "lucide-react";
import { ambientEngine } from "@/lib/ambientEngine";
import RainVisualizer from "@/components/visualizer/RainVisualizer";
import { usePlayerStore } from "@/store/usePlayerStore";
import { StreamEngineService, AuraicAudioAdapter } from "@/lib/sound-engine/client";
import Artwork from "@/components/Artwork";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

interface MoodStation {
  id: string;
  name: string;
  tagline: string;
  searchQuery: string;
  backupQuery: string;
  accent: string;
  glow: string;
  image: string;
  gradient: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATIONS: MoodStation[] = [
  {
    id: "deep-work",
    name: "Deep Work",
    tagline: "Tập trung cao độ & dòng chảy sáng tạo liền mạch",
    searchQuery: "ambient",
    backupQuery: "piano",
    accent: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.4)",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop",
    gradient: "from-cyan-950/40 via-blue-950/30 to-black/60",
    icon: Compass,
  },
  {
    id: "lofi-rain",
    name: "Lofi Rain",
    tagline: "Tiếng mưa rơi bên hiên cùng nhịp lofi ấm cúng",
    searchQuery: "lofi",
    backupQuery: "chillout",
    accent: "#6366f1",
    glow: "rgba(99, 102, 241, 0.4)",
    image: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?q=80&w=400&auto=format&fit=crop",
    gradient: "from-indigo-950/40 via-blue-950/30 to-black/60",
    icon: CloudRain,
  },
  {
    id: "midnight-chill",
    name: "Midnight Chill",
    tagline: "Âm hưởng êm đềm cho đêm muộn tĩnh lặng",
    searchQuery: "chillout",
    backupQuery: "downtempo",
    accent: "#a855f7",
    glow: "rgba(168, 85, 247, 0.4)",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400&auto=format&fit=crop",
    gradient: "from-purple-950/40 via-fuchsia-950/20 to-black/60",
    icon: Moon,
  },
  {
    id: "midnight-cyberpunk",
    name: "Midnight Cyber",
    tagline: "Nhịp synthwave & bassline tương lai huyền bí",
    searchQuery: "cyberpunk",
    backupQuery: "synthwave",
    accent: "#ec4899",
    glow: "rgba(236, 72, 153, 0.45)",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400&auto=format&fit=crop",
    gradient: "from-pink-950/40 via-purple-950/30 to-black/60",
    icon: Sparkles,
  },
  {
    id: "astral-drift",
    name: "Astral Drift",
    tagline: "Lơ lửng giữa không gian vũ trụ vô tận",
    searchQuery: "cinematic",
    backupQuery: "electronic",
    accent: "#ec4899",
    glow: "rgba(236, 72, 153, 0.4)",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop",
    gradient: "from-pink-950/40 via-violet-950/30 to-black/60",
    icon: Sparkles,
  },
  {
    id: "zen-forest",
    name: "Zen Forest",
    tagline: "Thanh tịnh tự nhiên, giải phóng mọi căng thẳng",
    searchQuery: "acoustic",
    backupQuery: "meditation",
    accent: "#10b981",
    glow: "rgba(16, 185, 129, 0.4)",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop",
    gradient: "from-emerald-950/40 via-teal-950/30 to-black/60",
    icon: Leaf,
  },
];

export default function StationsPage() {
  const [selectedStation, setSelectedStation] = useState<MoodStation>(STATIONS[0]);
  const [stationTracks, setStationTracks] = useState<any[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [rainVol, setRainVol] = useState(40);
  const [vinylVol, setVinylVol] = useState(35);
  const [wavesVol, setWavesVol] = useState(30);
  const [masterVol, setMasterVol] = useState(70);

  const { playMix, playTrack, currentTrack, isPlaying, toggleLike, likedIds } =
    usePlayerStore();

  const fetchTracks = useCallback(async (station: MoodStation) => {
    setLoadingTracks(true);
    try {
      const engineTracks = await StreamEngineService.fetchTracksByTag(station.searchQuery, 24);
      let tracks = engineTracks.map(AuraicAudioAdapter.toPlayerTrack);

      if (tracks.length < 12 && station.backupQuery) {
        const backupEngine = await StreamEngineService.fetchTracksByTag(station.backupQuery, 16);
        const backupConverted = backupEngine.map(AuraicAudioAdapter.toPlayerTrack);
        const seen = new Set(tracks.map((t) => t.id));
        for (const t of backupConverted) {
          if (!seen.has(t.id)) {
            tracks.push(t);
            seen.add(t.id);
          }
        }
      }

      if (tracks.length === 0) {
        const searchResults = await StreamEngineService.searchEngineCatalog(station.searchQuery, 24);
        tracks = searchResults.map(AuraicAudioAdapter.toPlayerTrack);
      }

      setStationTracks(tracks);
    } catch (error) {
      console.error("Lỗi tải bài hát station:", error);
      const searchResults = await StreamEngineService.searchEngineCatalog(station.searchQuery, 20);
      setStationTracks(searchResults.map(AuraicAudioAdapter.toPlayerTrack));
    } finally {
      setLoadingTracks(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks(selectedStation);
  }, [selectedStation, fetchTracks]);

  const toggleAmbient = () => {
    if (isAmbientPlaying) {
      ambientEngine.stop();
      setIsAmbientPlaying(false);
    } else {
      ambientEngine.start();
      ambientEngine.setRainVolume(rainVol / 100);
      ambientEngine.setVinylVolume(vinylVol / 100);
      ambientEngine.setWavesVolume(wavesVol / 100);
      ambientEngine.setMasterVolume(masterVol / 100);
      setIsAmbientPlaying(true);
    }
  };

  const handleRainChange = (val: number) => {
    setRainVol(val);
    ambientEngine.setRainVolume(val / 100);
  };

  const handleVinylChange = (val: number) => {
    setVinylVol(val);
    ambientEngine.setVinylVolume(val / 100);
  };

  const handleWavesChange = (val: number) => {
    setWavesVol(val);
    ambientEngine.setWavesVolume(val / 100);
  };

  const handleMasterChange = (val: number) => {
    setMasterVol(val);
    ambientEngine.setMasterVolume(val / 100);
  };

  const displayedTracks = stationTracks.filter((t) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const artistName = typeof t.artist === "object" ? t.artist.name : t.artist;
    return (
      t.title.toLowerCase().includes(q) ||
      artistName.toLowerCase().includes(q) ||
      (t.genre || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative min-h-full px-4 pb-36 pt-4 text-white sm:px-8 lg:px-12 select-none">
      <RainVisualizer themeColor={selectedStation.accent} />

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedStation.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b ${selectedStation.gradient}`}
        />
      </AnimatePresence>

      <div className="relative z-10 space-y-12">
        {/* 2D HARDWARE CONSOLE HEADER */}
        <section className="relative overflow-hidden rounded-[36px] border-2 border-white/15 bg-[#0d0f1b]/95 p-6 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.2)]">
          <div className="retro-screw absolute top-4 left-4" />
          <div className="retro-screw absolute top-4 right-4" />
          <div className="retro-screw absolute bottom-4 left-4" />
          <div className="retro-screw absolute bottom-4 right-4" />

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/40 px-3.5 py-1 text-xs font-arcade font-bold text-cyan-300">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                <span>2D AMBIENT RACK & VECTOR RADIO</span>
              </div>
              <h1 className="font-pixel text-3xl sm:text-5xl font-black tracking-tight text-white">
                Stations & Ambient Studio
              </h1>
              <p className="font-arcade text-xs sm:text-sm text-white/60 tracking-wider max-w-xl leading-relaxed">
                Pha trộn âm thanh tự nhiên đa dải tần (Rain, Vinyl, Waves) cùng bài hát nền qua bộ Fader Capsule 2D chuyên nghiệp.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleAmbient}
                className={`flex items-center gap-2.5 rounded-full px-6 py-3 font-pixel text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                  isAmbientPlaying
                    ? "bg-white text-black font-bold shadow-[0_0_25px_rgba(255,255,255,0.7)] scale-105 border-2 border-white"
                    : "border-2 border-white/30 bg-transparent text-white hover:border-white hover:bg-white/[0.08]"
                }`}
              >
                {isAmbientPlaying ? (
                  <>
                    <Pause className="h-4 w-4 fill-black text-black" />
                    <span>AMBIENT ĐANG BẬT</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                    <span>KÍCH HOẠT AMBIENT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* 1. CHANNEL SELECTOR CARDS (2D VECTOR CHANNEL TILES) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-pixel text-xl sm:text-2xl font-bold tracking-tight text-white">
              Radio Channel Selector
            </h2>
            <span className="font-arcade text-xs text-cyan-300">
              Vector Channel Tiles
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {STATIONS.map((station) => {
              const Icon = station.icon;
              const isSelected = selectedStation.id === station.id;

              return (
                <div
                  key={station.id}
                  onClick={() => {
                    setSelectedStation(station);
                    setFilterQuery("");
                  }}
                  className={`group relative p-3.5 rounded-[28px] border-2 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? "border-white bg-[#151829] shadow-[0_0_25px_rgba(255,255,255,0.35)] scale-105"
                      : "border-white/15 bg-[#0e101c]/90 hover:border-white/40 hover:scale-[1.02]"
                  }`}
                >
                  {/* Rounded image frame matching 2D vector style */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-white/15 mb-3 shadow-md">
                    <Artwork
                      src={station.image}
                      alt={station.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div
                      style={{
                        backgroundColor: isSelected ? "#ffffff" : "rgba(0, 0, 0, 0.6)",
                        color: isSelected ? "#000000" : "#ffffff",
                      }}
                      className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-xl border border-white/20 shadow-md"
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(6,182,212,1)] animate-ping" />
                    )}
                  </div>

                  <div>
                    <h3 className="font-pixel text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                      {station.name}
                    </h3>
                    <p className="mt-0.5 font-arcade text-[10px] text-white/50 line-clamp-1">
                      {station.tagline}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. AMBIENT RACK MIXER (2D CAPSULE FADERS WITH PIXEL PERCENTAGE READOUTS) */}
        <section className="relative overflow-hidden rounded-[36px] border-2 border-white/20 bg-[#0e101c]/95 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.2)]">
          <div className="retro-screw absolute top-3.5 left-3.5" />
          <div className="retro-screw absolute top-3.5 right-3.5" />
          <div className="retro-screw absolute bottom-3.5 left-3.5" />
          <div className="retro-screw absolute bottom-3.5 right-3.5" />

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <h2 className="font-pixel text-xl sm:text-2xl font-bold">Ambient Sound Rack Mixer</h2>
              </div>
              <p className="font-arcade text-xs text-white/50 mt-1 tracking-wider">
                Điều chỉnh âm lượng 2D Capsule Faders cho 3 dải âm thanh tự nhiên
              </p>
            </div>

            {/* Master Fader Capsule */}
            <div className="flex items-center gap-3 rounded-full border-2 border-white/20 bg-black/60 px-5 py-2.5 shadow-md">
              <span className="font-pixel text-xs font-bold text-white">MASTER:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVol}
                onChange={(e) => handleMasterChange(Number(e.target.value))}
                className="h-2 w-28 sm:w-36 cursor-pointer accent-white"
              />
              <span className="font-pixel text-xs font-bold text-cyan-300 w-16 text-right">
                {masterVol}%
              </span>
            </div>
          </div>

          {/* 3 Channels: 2D Capsule Faders */}
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* 1. Rain Channel */}
            <div className="rounded-[28px] border-2 border-white/15 bg-black/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300 border-2 border-blue-400/30">
                    <CloudRain className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-pixel text-sm font-bold text-white">Rain Channel</h3>
                    <p className="font-arcade text-[10px] text-white/40">Pink noise rain</p>
                  </div>
                </div>
                {/* Pixel Readout: VOLUME: 40% */}
                <span className="font-pixel text-xs font-bold text-blue-300 px-3 py-1 rounded-full border border-blue-400/30 bg-blue-950/40">
                  VOLUME: {rainVol}%
                </span>
              </div>

              {/* 2D Capsule Fader Bar */}
              <div className="relative h-6 w-full rounded-full border-2 border-white/20 bg-black/80 p-0.5 overflow-hidden flex items-center">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                  style={{ width: `${rainVol}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={rainVol}
                  onChange={(e) => handleRainChange(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>

            {/* 2. Vinyl Crackle Channel */}
            <div className="rounded-[28px] border-2 border-white/15 bg-black/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border-2 border-amber-400/30">
                    <Disc className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-pixel text-sm font-bold text-white">Vinyl Crackle</h3>
                    <p className="font-arcade text-[10px] text-white/40">33⅓ RPM analog hiss</p>
                  </div>
                </div>
                {/* Pixel Readout: VOLUME: 35% */}
                <span className="font-pixel text-xs font-bold text-amber-300 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-950/40">
                  VOLUME: {vinylVol}%
                </span>
              </div>

              {/* 2D Capsule Fader Bar */}
              <div className="relative h-6 w-full rounded-full border-2 border-white/20 bg-black/80 p-0.5 overflow-hidden flex items-center">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                  style={{ width: `${vinylVol}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={vinylVol}
                  onChange={(e) => handleVinylChange(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>

            {/* 3. Ocean Waves Channel */}
            <div className="rounded-[28px] border-2 border-white/15 bg-black/50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300 border-2 border-teal-400/30">
                    <Waves className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-pixel text-sm font-bold text-white">Ocean Waves</h3>
                    <p className="font-arcade text-[10px] text-white/40">Deep low tide surf</p>
                  </div>
                </div>
                {/* Pixel Readout: VOLUME: 30% */}
                <span className="font-pixel text-xs font-bold text-teal-300 px-3 py-1 rounded-full border border-teal-400/30 bg-teal-950/40">
                  VOLUME: {wavesVol}%
                </span>
              </div>

              {/* 2D Capsule Fader Bar */}
              <div className="relative h-6 w-full rounded-full border-2 border-white/20 bg-black/80 p-0.5 overflow-hidden flex items-center">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-400 transition-all shadow-[0_0_12px_rgba(20,184,166,0.6)]"
                  style={{ width: `${wavesVol}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={wavesVol}
                  onChange={(e) => handleWavesChange(Number(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. CHANNEL TRACKS LIST (2D CARTOON TILES) */}
        <section className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-pixel text-2xl font-bold tracking-tight text-white">
                Kênh: {selectedStation.name}
              </h2>
              <p className="font-arcade text-xs text-white/50 tracking-wider">
                {displayedTracks.length} bài hát nền thiết kế cho kênh {selectedStation.name}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Lọc bài hát..."
                  className="rounded-full border-2 border-white/20 bg-white/[0.06] py-2 pl-10 pr-4 font-pixel text-xs text-white placeholder:text-white/40 focus:border-white focus:outline-none transition-all"
                />
              </div>

              <button
                onClick={() => fetchTracks(selectedStation)}
                className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2 font-pixel text-xs text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
                title="Tải lại danh sách"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingTracks ? "animate-spin" : ""}`} />
                <span>Làm mới</span>
              </button>

              {displayedTracks.length > 0 && (
                <button
                  onClick={() => playMix(displayedTracks, `${selectedStation.name} Station`)}
                  className="flex items-center gap-2 rounded-full border-2 border-white bg-white px-5 py-2 font-pixel text-xs font-bold text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-black" /> PHÁT TOÀN BỘ
                </button>
              )}
            </div>
          </div>

          {loadingTracks ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-3xl border-2 border-white/10 bg-white/[0.03]"
                />
              ))}
            </div>
          ) : displayedTracks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedTracks.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                const isLiked = likedIds.includes(track.id);
                const artistText = typeof track.artist === "object" ? track.artist.name : track.artist;

                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, displayedTracks)}
                    className="group flex cursor-pointer items-center justify-between gap-3 p-3.5 rounded-3xl border-2 border-white/10 bg-[#0f111e]/90 hover:border-cyan-400/50 hover:shadow-[0_10px_25px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.2)] transition-all select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-white/15 shadow-md">
                        <Artwork
                          src={track.image}
                          alt={track.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isCurrent && isPlaying ? (
                            <Pause className="h-4 w-4 fill-white text-white" />
                          ) : (
                            <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <h3
                          className={`truncate font-pixel text-xs font-bold transition-colors ${
                            isCurrent ? "text-cyan-300" : "text-white group-hover:text-cyan-200"
                          }`}
                        >
                          {track.title}
                        </h3>
                        <p className="truncate font-arcade text-[11px] text-white/50 tracking-wider">
                          by {artistText}
                        </p>
                        <div className="flex items-center gap-1.5 font-arcade text-[10px] text-white/40">
                          <span>{formatDuration(track.duration)}</span>
                          <span>•</span>
                          <span className="truncate text-cyan-300">{track.genres?.[0] || "Ambient"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(track);
                        }}
                        className="p-1.5 text-white/40 transition hover:text-rose-400 cursor-pointer"
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            isLiked ? "fill-rose-500 text-rose-500" : ""
                          }`}
                        />
                      </button>
                      <div className="h-9 w-9 rounded-full border-2 border-white/30 flex items-center justify-center group-hover:border-white group-hover:bg-white group-hover:text-black text-white transition-all shadow-sm">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.02]">
              <Radio className="h-10 w-10 text-white/20 mb-3" />
              <p className="font-pixel text-sm text-white/60">
                Không tìm thấy bài hát phù hợp với bộ lọc
              </p>
              <button
                onClick={() => {
                  setFilterQuery("");
                  fetchTracks(selectedStation);
                }}
                className="mt-3 font-arcade text-xs text-cyan-300 underline hover:text-cyan-200"
              >
                Đặt lại bộ lọc & tải lại
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
