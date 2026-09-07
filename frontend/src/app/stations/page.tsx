"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  CloudRain,
  Disc,
  Waves,
  Volume2,
  VolumeX,
  Sparkles,
  Play,
  Pause,
  Sliders,
  Check,
  Moon,
  Leaf,
  Compass,
  Search,
  RefreshCw,
  Clock,
  Heart,
} from "lucide-react";
import { ambientEngine } from "@/lib/ambientEngine";
import RainVisualizer from "@/components/visualizer/RainVisualizer";
import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { getJamendoTracks, JamendoSong, formatDuration } from "@/lib/api";
import Artwork from "@/components/Artwork";
import TiltCard from "@/components/ui/TiltCard";

interface MoodStation {
  id: string;
  name: string;
  tagline: string;
  searchQuery: string;
  backupQuery: string;
  accent: string;
  glow: string;
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
    gradient: "from-purple-950/40 via-fuchsia-950/20 to-black/60",
    icon: Moon,
  },
  {
    id: "astral-drift",
    name: "Astral Drift",
    tagline: "Lơ lửng giữa không gian vũ trụ vô tận",
    searchQuery: "cinematic",
    backupQuery: "electronic",
    accent: "#ec4899",
    glow: "rgba(236, 72, 153, 0.4)",
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
    glow: "rgba(168, 85, 247, 0.4)",
    gradient: "from-emerald-950/40 via-teal-950/30 to-black/60",
    icon: Leaf,
  },
];

export default function StationsPage() {
  const [selectedStation, setSelectedStation] = useState<MoodStation>(STATIONS[0]);
  const [stationTracks, setStationTracks] = useState<JamendoSong[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  // Ambient Layering State
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [rainVol, setRainVol] = useState(40);
  const [vinylVol, setVinylVol] = useState(35);
  const [wavesVol, setWavesVol] = useState(30);
  const [masterVol, setMasterVol] = useState(70);

  const { playMix, playTrack, currentTrack, isPlaying, toggleLike, likedIds } =
    usePlayerStore();

  // Load tracks when station changes
  const fetchTracks = useCallback(async (station: MoodStation) => {
    setLoadingTracks(true);
    try {
      // 1. Primary search query
      let tracks = await getJamendoTracks({
        limit: 24,
        search: station.searchQuery,
      });

      // 2. If results are sparse (< 12), supplement with backup query
      if (tracks.length < 12 && station.backupQuery) {
        const backupTracks = await getJamendoTracks({
          limit: 16,
          search: station.backupQuery,
        }).catch(() => []);

        const seen = new Set(tracks.map((t) => t.id));
        for (const t of backupTracks) {
          if (!seen.has(t.id)) {
            tracks.push(t);
            seen.add(t.id);
          }
        }
      }

      // 3. If still empty (e.g. strict rate limit), fetch general tracks
      if (tracks.length === 0) {
        tracks = await getJamendoTracks({ limit: 24 }).catch(() => []);
      }

      setStationTracks(tracks);
    } catch (error) {
      console.error("Lỗi tải bài hát station:", error);
      const fallback = await getJamendoTracks({ limit: 20 }).catch(() => []);
      setStationTracks(fallback);
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

  // Filtered tracks
  const displayedTracks = stationTracks.filter((t) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const artistName = typeof t.artist === "object" ? t.artist.name : t.artist;
    return (
      t.title.toLowerCase().includes(q) ||
      artistName.toLowerCase().includes(q) ||
      (t.genres || []).some((g) => g.toLowerCase().includes(q))
    );
  });

  return (
    <div className="relative min-h-full px-5 pb-36 pt-4 text-white sm:px-8 lg:px-12">
      {/* Bass & Particle Droplet Visualizer Canvas */}
      <RainVisualizer themeColor={selectedStation.accent} />

      {/* Dynamic Mood Backdrop with Smooth Cross-fade */}
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

      <div className="relative z-10 space-y-10">
        {/* ========================================================= */}
        {/* HEADER: AMBIENT STUDIO                                    */}
        {/* ========================================================= */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
              <Radio className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
              <span>Auraic Studio Engine</span>
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Stations & Ambient Studio
            </h1>
            <p className="mt-2 text-sm text-white/60 max-w-xl">
              Pha trộn các dải tần âm thanh tự nhiên (Web Audio API) đè lên bài
              hát chính để kiến tạo không gian tĩnh tại độc bản.
            </p>
          </div>

          {/* Master Ambient Layering Engine Switch */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleAmbient}
              className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg backdrop-blur-xl transition-all ${
                isAmbientPlaying
                  ? "bg-cyan-500 text-black shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                  : "border border-white/20 bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              {isAmbientPlaying ? (
                <>
                  <Pause className="h-4 w-4 fill-current" />
                  <span>Ambient Đang Bật</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Kích Hoạt Ambient Engine</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 1. MOOD SELECTOR (CROSS-FADE TONE TABS)                   */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white/50">
              Chọn Tâm Trạng (Mood Channels)
            </h2>
            <span className="text-xs text-white/40">
              Chuyển đổi tức thì sắc độ và dải âm
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
            {STATIONS.map((station) => {
              const Icon = station.icon;
              const isSelected = selectedStation.id === station.id;

              return (
                <TiltCard
                  key={station.id}
                  glowColor={station.glow}
                  depthZ={16}
                  onClick={() => {
                    setSelectedStation(station);
                    setFilterQuery("");
                  }}
                  className={`p-4 text-left transition-all duration-300 ${
                    isSelected
                      ? "border-white/40 bg-white/[0.12] shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                      : "hover:border-white/25"
                  }`}
                >
                  <div
                    style={{
                      backgroundColor: isSelected ? station.accent : "transparent",
                    }}
                    className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl opacity-40 transition-colors"
                  />

                  <div className="flex items-center justify-between">
                    <div
                      style={{
                        backgroundColor: isSelected
                          ? station.accent
                          : "rgba(255, 255, 255, 0.08)",
                        color: isSelected ? "#000" : "#fff",
                        transform: "translateZ(12px)",
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-xl shadow-md transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {isSelected && (
                      <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(6,182,212,1)] animate-ping" />
                    )}
                  </div>

                  <div className="mt-4" style={{ transform: "translateZ(10px)" }}>
                    <h3 className="font-bold text-sm text-white">{station.name}</h3>
                    <p className="mt-1 text-xs text-white/55 line-clamp-2 leading-relaxed">
                      {station.tagline}
                    </p>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. AMBIENT LAYERING ENGINE CONTROLS                       */}
        {/* ========================================================= */}
        <section className="rounded-3xl border border-white/15 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-400" />
                <h2 className="text-lg font-bold">Ambient Layering Engine</h2>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                Điều chỉnh âm lượng riêng biệt cho 3 kênh âm thanh phụ
              </p>
            </div>

            {/* Master slider */}
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-2">
              <span className="text-xs font-semibold text-white/70">Master:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVol}
                onChange={(e) => handleMasterChange(Number(e.target.value))}
                className="h-1.5 w-24 sm:w-32 cursor-pointer accent-cyan-400"
              />
              <span className="font-mono text-xs text-cyan-300 w-8 text-right">
                {masterVol}%
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Channel 1: Rain */}
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
                    <CloudRain className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Tiếng Mưa (Rain)</h3>
                    <p className="text-[11px] text-white/40">Pink noise filter</p>
                  </div>
                </div>
                <span className="font-mono text-xs text-blue-300">{rainVol}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={rainVol}
                onChange={(e) => handleRainChange(Number(e.target.value))}
                className="mt-4 w-full h-1.5 cursor-pointer accent-blue-400"
              />
            </div>

            {/* Channel 2: Vinyl Crackle */}
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                    <Disc className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Đĩa Than (Vinyl)</h3>
                    <p className="text-[11px] text-white/40">Crackle & surface hiss</p>
                  </div>
                </div>
                <span className="font-mono text-xs text-amber-300">{vinylVol}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={vinylVol}
                onChange={(e) => handleVinylChange(Number(e.target.value))}
                className="mt-4 w-full h-1.5 cursor-pointer accent-amber-400"
              />
            </div>

            {/* Channel 3: Ocean Waves */}
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300">
                    <Waves className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Sóng Biển (Waves)</h3>
                    <p className="text-[11px] text-white/40">LFO deep surf</p>
                  </div>
                </div>
                <span className="font-mono text-xs text-teal-300">{wavesVol}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={wavesVol}
                onChange={(e) => handleWavesChange(Number(e.target.value))}
                className="mt-4 w-full h-1.5 cursor-pointer accent-teal-400"
              />
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. CURATED STATION TRACKS                                 */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Danh Sách Bài Hát: {selectedStation.name}
              </h2>
              <p className="text-xs text-white/50">
                {displayedTracks.length} bài hát nền chất lượng cao được thiết kế hoàn hảo để kết hợp cùng Ambient Layer
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Inline search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/40" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Lọc bài hát trong kênh..."
                  className="rounded-xl border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/40 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              {/* Refresh button */}
              <button
                onClick={() => fetchTracks(selectedStation)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
                title="Tải lại danh sách"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingTracks ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </button>

              {displayedTracks.length > 0 && (
                <button
                  onClick={() => playMix(displayedTracks, `${selectedStation.name} Station`)}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black shadow-lg transition hover:bg-neutral-100"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Phát toàn bộ
                </button>
              )}
            </div>
          </div>

          {loadingTracks ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
                />
              ))}
            </div>
          ) : displayedTracks.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedTracks.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                const isLiked = likedIds.includes(track.id);

                return (
                  <TiltCard
                    key={track.id}
                    onClick={() => playTrack(track, displayedTracks)}
                    glowColor="rgba(6, 182, 212, 0.35)"
                    depthZ={12}
                    className="group flex cursor-pointer items-center justify-between gap-3 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Cover with 3D elevation */}
                      <div
                        style={{ transform: "translateZ(10px)" }}
                        className="relative h-13 w-13 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-sm"
                      >
                        <Artwork
                          src={track.image}
                          alt={track.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                          {isCurrent && isPlaying ? (
                            <Pause className="h-4 w-4 fill-white text-white" />
                          ) : (
                            <Play className="h-4 w-4 fill-white text-white ml-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <h3
                          className={`truncate text-xs font-bold transition-colors ${
                            isCurrent ? "text-cyan-300" : "text-white group-hover:text-violet-200"
                          }`}
                        >
                          {track.title}
                        </h3>
                        <p className="truncate text-[11px] text-white/50 mt-0.5">
                          {typeof track.artist === "object"
                            ? track.artist.name
                            : track.artist}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-white/40 font-mono">
                          <span>{formatDuration(track.duration)}</span>
                          <span>•</span>
                          <span className="truncate">{track.genres?.[0] || "Ambient"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Like button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(track);
                      }}
                      className="p-2 text-white/40 transition hover:text-rose-400 shrink-0 cursor-pointer"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isLiked ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                    </button>
                  </TiltCard>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-white/10 bg-white/[0.02]">
              <Radio className="h-10 w-10 text-white/20 mb-3" />
              <p className="text-sm font-semibold text-white/60">
                Không tìm thấy bài hát phù hợp với bộ lọc
              </p>
              <button
                onClick={() => {
                  setFilterQuery("");
                  fetchTracks(selectedStation);
                }}
                className="mt-3 text-xs text-cyan-300 underline hover:text-cyan-200"
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
