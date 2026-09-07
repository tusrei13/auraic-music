"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { ambientEngine } from "@/lib/ambientEngine";
import RainVisualizer from "@/components/visualizer/RainVisualizer";
import { usePlayerStore } from "@/store/usePlayerStore";
import { getJamendoTracks, JamendoSong } from "@/lib/api";
import Artwork from "@/components/Artwork";

interface MoodStation {
  id: string;
  name: string;
  tagline: string;
  tags: string;
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
    tags: "ambient focus drone",
    accent: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.4)",
    gradient: "from-cyan-950/40 via-blue-950/30 to-black/60",
    icon: Compass,
  },
  {
    id: "lofi-rain",
    name: "Lofi Rain",
    tagline: "Tiếng mưa rơi bên hiên cùng nhịp lofi ấm cúng",
    tags: "lofi chill hop",
    accent: "#6366f1",
    glow: "rgba(99, 102, 241, 0.4)",
    gradient: "from-indigo-950/40 via-blue-950/30 to-black/60",
    icon: CloudRain,
  },
  {
    id: "midnight-chill",
    name: "Midnight Chill",
    tagline: "Âm hưởng êm đềm cho đêm muộn tĩnh lặng",
    tags: "chillout downtempo synth",
    accent: "#a855f7",
    glow: "rgba(168, 85, 247, 0.4)",
    gradient: "from-purple-950/40 via-fuchsia-950/20 to-black/60",
    icon: Moon,
  },
  {
    id: "astral-drift",
    name: "Astral Drift",
    tagline: "Lơ lửng giữa không gian vũ trụ vô tận",
    tags: "space cinematic ambient",
    accent: "#ec4899",
    glow: "rgba(236, 72, 153, 0.4)",
    gradient: "from-pink-950/40 via-violet-950/30 to-black/60",
    icon: Sparkles,
  },
  {
    id: "zen-forest",
    name: "Zen Forest",
    tagline: "Thanh tịnh tự nhiên, giải phóng mọi căng thẳng",
    tags: "acoustic meditation nature",
    accent: "#10b981",
    glow: "rgba(16, 185, 129, 0.4)",
    gradient: "from-emerald-950/40 via-teal-950/30 to-black/60",
    icon: Leaf,
  },
];

export default function StationsPage() {
  const [selectedStation, setSelectedStation] = useState<MoodStation>(STATIONS[0]);
  const [stationTracks, setStationTracks] = useState<JamendoSong[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

  // Ambient Layering State
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [rainVol, setRainVol] = useState(40);
  const [vinylVol, setVinylVol] = useState(35);
  const [wavesVol, setWavesVol] = useState(30);
  const [masterVol, setMasterVol] = useState(70);

  const { playMix, playTrack, currentTrack, isPlaying } = usePlayerStore();

  // Load tracks when station changes
  useEffect(() => {
    let active = true;
    setLoadingTracks(true);

    getJamendoTracks({ limit: 8, tags: selectedStation.tags })
      .then((tracks) => {
        if (active) setStationTracks(tracks);
      })
      .catch(() => {
        if (active) setStationTracks([]);
      })
      .finally(() => {
        if (active) setLoadingTracks(false);
      });

    return () => {
      active = false;
    };
  }, [selectedStation]);

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
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {STATIONS.map((station) => {
              const Icon = station.icon;
              const isSelected = selectedStation.id === station.id;

              return (
                <button
                  key={station.id}
                  onClick={() => setSelectedStation(station)}
                  className={`group relative overflow-hidden rounded-2xl border p-4 text-left backdrop-blur-2xl transition-all duration-300 ${
                    isSelected
                      ? "border-white/40 bg-white/[0.12] shadow-2xl scale-[1.02]"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]"
                  }`}
                >
                  <div
                    style={{
                      backgroundColor: isSelected ? station.accent : "transparent",
                    }}
                    className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-40 transition-colors"
                  />

                  <div className="flex items-center justify-between">
                    <div
                      style={{
                        backgroundColor: isSelected
                          ? station.accent
                          : "rgba(255, 255, 255, 0.08)",
                        color: isSelected ? "#000" : "#fff",
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    {isSelected && (
                      <span className="flex h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.9)] animate-ping" />
                    )}
                  </div>

                  <div className="mt-4">
                    <h3 className="font-bold text-sm">{station.name}</h3>
                    <p className="mt-1 text-xs text-white/50 line-clamp-2 leading-relaxed">
                      {station.tagline}
                    </p>
                  </div>
                </button>
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                Danh Sách Bài Hát: {selectedStation.name}
              </h2>
              <p className="text-xs text-white/50">
                Các bản nhạc nền được thiết kế hoàn hảo để kết hợp cùng Ambient Layer
              </p>
            </div>
            {stationTracks.length > 0 && (
              <button
                onClick={() => playMix(stationTracks, `${selectedStation.name} Station`)}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Phát toàn bộ
              </button>
            )}
          </div>

          {loadingTracks ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stationTracks.map((track) => {
                const isCurrent = currentTrack?.id === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, stationTracks)}
                    className="group flex cursor-pointer items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl transition hover:border-white/30 hover:bg-white/[0.07]"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <Artwork
                        src={track.image}
                        alt={track.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                        <Play className="h-4 w-4 fill-white text-white" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        className={`truncate text-sm font-bold ${
                          isCurrent ? "text-cyan-300" : "text-white"
                        }`}
                      >
                        {track.title}
                      </h3>
                      <p className="truncate text-xs text-white/50">
                        {typeof track.artist === "object"
                          ? track.artist.name
                          : track.artist}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
