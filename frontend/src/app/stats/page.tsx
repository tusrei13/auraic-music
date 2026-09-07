"use client";

import React, { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  Activity,
  Download,
  Sparkles,
  Share2,
  Headphones,
  Flame,
  Award,
  Calendar,
  Disc3,
  Clock,
  Radio,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useToastStore } from "@/store/useToastStore";

// =========================================================
// 1. SOUND RADAR DATA & COMPONENT
// =========================================================
interface RadarAxis {
  label: string;
  value: number; // 0 - 100
}

const RADAR_AXES: RadarAxis[] = [
  { label: "Acoustic", value: 85 },
  { label: "Chill", value: 92 },
  { label: "Instrumental", value: 78 },
  { label: "Energetic", value: 64 },
  { label: "Electronic", value: 70 },
  { label: "Vocal", value: 88 },
];

function SoundRadarChart({ axes = RADAR_AXES }: { axes?: RadarAxis[] }) {
  const size = 300;
  const center = size / 2;
  const radius = size * 0.38;
  const total = axes.length;

  const getCoordinates = (index: number, val: number) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const r = (val / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Polygon points
  const points = axes
    .map((axis, i) => {
      const { x, y } = getCoordinates(i, axis.value);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="relative flex flex-col items-center justify-center py-2">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id="radarGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.05" />
          </radialGradient>
          <filter id="radarNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background polygon webs */}
        {[0.25, 0.5, 0.75, 1].map((level) => {
          const webPoints = axes
            .map((_, i) => {
              const { x, y } = getCoordinates(i, level * 100);
              return `${x},${y}`;
            })
            .join(" ");

          return (
            <polygon
              key={level}
              points={webPoints}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={level === 1 ? 1.5 : 1}
            />
          );
        })}

        {/* Axis radial spokes */}
        {axes.map((_, i) => {
          const { x, y } = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeDasharray="2 2"
            />
          );
        })}

        {/* Data polygon filled with neon 3D glow */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          points={points}
          fill="url(#radarGlowGrad)"
          stroke="#c084fc"
          strokeWidth={3}
          filter="url(#radarNeonGlow)"
        />

        {/* Vertex dots with outer pulse glow ring */}
        {axes.map((axis, i) => {
          const { x, y } = getCoordinates(i, axis.value);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={7}
                fill="none"
                stroke="#06b6d4"
                strokeWidth={1.5}
                opacity={0.6}
                className="animate-ping"
              />
              <circle
                cx={x}
                cy={y}
                r={4.5}
                fill="#ffffff"
                stroke="#06b6d4"
                strokeWidth={2}
                className="filter drop-shadow-[0_0_8px_#06b6d4]"
              />
            </g>
          );
        })}

        {/* Axis labels */}
        {axes.map((axis, i) => {
          const { x, y } = getCoordinates(i, 118);
          return (
            <text
              key={i}
              x={x}
              y={y + 4}
              textAnchor="middle"
              className="fill-white/80 text-[10px] font-mono font-bold tracking-wider"
            >
              {axis.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// =========================================================
// 2. LISTENING HEATMAP (NEON GITHUB STYLE)
// =========================================================
function ListeningHeatmap() {
  const weeks = 20;
  const days = 7;
  const [hoveredCell, setHoveredCell] = useState<{
    day: number;
    week: number;
    minutes: number;
  } | null>(null);

  // Generate deterministic activity levels for demo
  const getActivity = (w: number, d: number) => {
    const val = (Math.sin(w * 1.5 + d) * 1000) % 5;
    const level = Math.floor(Math.abs(val));
    const minutes = level * 35 + ((w * 7 + d) % 20);
    return { level, minutes };
  };

  const getCellColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-cyan-950/60 border border-cyan-800/40";
      case 2:
        return "bg-cyan-700/70 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]";
      case 3:
        return "bg-violet-600 border border-violet-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]";
      case 4:
        return "bg-fuchsia-400 border border-white shadow-[0_0_12px_rgba(236,72,153,0.8)]";
      default:
        return "bg-white/[0.04] border border-white/[0.05]";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>Cường độ nghe nhạc (Listening Activity)</span>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span>Ít</span>
          <span className="h-2.5 w-2.5 rounded-xs bg-white/[0.04]" />
          <span className="h-2.5 w-2.5 rounded-xs bg-cyan-950" />
          <span className="h-2.5 w-2.5 rounded-xs bg-cyan-700" />
          <span className="h-2.5 w-2.5 rounded-xs bg-violet-600" />
          <span className="h-2.5 w-2.5 rounded-xs bg-fuchsia-400" />
          <span>Nhiều</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 p-1">
          {Array.from({ length: weeks * days }).map((_, idx) => {
            const w = Math.floor(idx / days);
            const d = idx % days;
            const { level, minutes } = getActivity(w, d);

            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.35 }}
                onMouseEnter={() => setHoveredCell({ day: d, week: w, minutes })}
                onMouseLeave={() => setHoveredCell(null)}
                className={`h-3.5 w-3.5 cursor-pointer rounded-xs transition-colors duration-200 ${getCellColor(
                  level
                )}`}
              />
            );
          })}
        </div>
      </div>

      {hoveredCell ? (
        <p className="text-xs text-cyan-300 font-mono">
          Tuần {hoveredCell.week + 1}, Ngày {hoveredCell.day + 1}:{" "}
          <span className="font-bold">{hoveredCell.minutes} phút nghe nhạc</span>
        </p>
      ) : (
        <p className="text-xs text-white/40">
          Rê chuột lên từng ô để xem chi tiết thời lượng
        </p>
      )}
    </div>
  );
}

// =========================================================
// 3. 3D HOLOGRAPHIC PASSPORT WITH EXPORT TO PNG
// =========================================================
export default function StatsPage() {
  const currentUser = useAuthStore((s) => s.user);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const { addToast } = useToastStore();

  const [exporting, setExporting] = useState(false);

  // 3D Tilt for Holographic Passport
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const spring = { damping: 22, stiffness: 220 };
  const mouseXSpring = useSpring(x, spring);
  const mouseYSpring = useSpring(y, spring);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [16, -16]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-16, 16]);

  const holoX = useTransform(mouseXSpring, [-0.5, 0.5], ["10%", "90%"]);
  const holoY = useTransform(mouseYSpring, [-0.5, 0.5], ["10%", "90%"]);
  const holoRotate = useTransform(mouseXSpring, [-0.5, 0.5], [0, 360]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Export Passport as PNG via HTML5 Canvas
  const handleExportPNG = async () => {
    setExporting(true);
    try {
      const canvas = document.createElement("canvas");
      const width = 640;
      const height = 400;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#130924");
      bgGrad.addColorStop(0.5, "#0b0c1b");
      bgGrad.addColorStop(1, "#031526");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw Holographic diagonal foil streak
      const foilGrad = ctx.createLinearGradient(0, 0, width, 0);
      foilGrad.addColorStop(0, "rgba(236, 72, 153, 0.15)");
      foilGrad.addColorStop(0.3, "rgba(168, 85, 247, 0.25)");
      foilGrad.addColorStop(0.7, "rgba(6, 182, 212, 0.2)");
      foilGrad.addColorStop(1, "rgba(234, 179, 8, 0.15)");
      ctx.fillStyle = foilGrad;
      ctx.fillRect(0, 0, width, height);

      // Card border
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // Passport Title
      ctx.fillStyle = "#a855f7";
      ctx.font = "bold 13px monospace";
      ctx.fillText("AURAIC AUDIOPHILE PASSPORT", 35, 45);

      // Name & Level
      const name = currentUser?.name || currentUser?.email?.split("@")[0] || "Auraic Explorer";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 28px sans-serif";
      ctx.fillText(name, 35, 95);

      ctx.fillStyle = "#06b6d4";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("Level: Master Audiophile (96kHz / 24-Bit)", 35, 125);

      // Chip simulator
      ctx.fillStyle = "#eab308";
      ctx.fillRect(35, 145, 50, 36);
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(35, 145, 50, 36);

      // Stats Columns
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "12px sans-serif";
      ctx.fillText("Gu nhạc chính", 35, 220);
      ctx.fillText("Thời lượng nghe", 220, 220);
      ctx.fillText("Độ chuẩn xác dải âm", 420, 220);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("Lofi • Ambient • Chill", 35, 245);
      ctx.fillText("148.5 Giờ", 220, 245);
      ctx.fillText("99.4% Hi-Res", 420, 245);

      // Barcode lines at bottom
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      for (let i = 35; i < width - 35; i += 6) {
        const barW = (i % 12 === 0) ? 3 : 1.5;
        ctx.fillRect(i, 320, barW, 40);
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "10px monospace";
      ctx.fillText("AUR-9948-HIRES-PRO-PASS", 35, 380);

      // Download
      const link = document.createElement("a");
      link.download = `auraic-passport-${name.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      addToast("Đã xuất thẻ Passport PNG thành công!", "success");
    } catch {
      addToast("Lỗi khi tạo ảnh Passport", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-full px-5 pb-36 pt-4 text-white sm:px-8 lg:px-12 space-y-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
          <Activity className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
          <span>Audio Analytics & Taste DNA</span>
        </div>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Thống Kê Gu Nhạc
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Phân tích đa chiều về tần số âm thanh, chu kỳ thưởng thức và thẻ danh tính
          Holographic độc bản.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-start">
        {/* ========================================================= */}
        {/* 1. SOUND RADAR CHART                                      */}
        {/* ========================================================= */}
        <section className="rounded-3xl border border-white/15 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-2xl shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Sound Radar Chart</h2>
              <p className="text-xs text-white/50">
                Biểu đồ đa giác phân bố 6 trục thẩm mỹ âm nhạc
              </p>
            </div>
            <span className="rounded-xl bg-violet-500/20 px-3 py-1 text-xs font-bold text-violet-300">
              Chillout Dominant
            </span>
          </div>

          <SoundRadarChart />

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
              <span className="text-[10px] text-white/40 uppercase font-mono">Top Genre</span>
              <p className="font-bold text-sm text-cyan-300 mt-0.5">Chill / Lofi</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
              <span className="text-[10px] text-white/40 uppercase font-mono">BPM Range</span>
              <p className="font-bold text-sm text-fuchsia-300 mt-0.5">75 - 90 BPM</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3 text-center">
              <span className="text-[10px] text-white/40 uppercase font-mono">Hi-Res Affinity</span>
              <p className="font-bold text-sm text-amber-300 mt-0.5">94.2%</p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. 3D HOLOGRAPHIC PASSPORT                                */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Holographic Passport 3D</h2>
              <p className="text-xs text-white/50">
                Thẻ định danh âm nhạc phản quang góc nhìn tương tác chuột
              </p>
            </div>
            <button
              onClick={handleExportPNG}
              disabled={exporting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-600/25 transition hover:scale-105 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{exporting ? "Đang xuất..." : "Xuất file ảnh PNG"}</span>
            </button>
          </div>

          {/* Holographic 3D Interactive Card */}
          <div className="perspective-1000 flex justify-center py-4">
            <motion.div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }}
              whileHover={{ scale: 1.04 }}
              className="relative w-full max-w-md aspect-[1.58/1] rounded-3xl border-2 border-white/30 bg-gradient-to-br from-[#0c0d18] via-[#141026] to-[#08121f] p-6 shadow-[0_25px_65px_rgba(0,0,0,0.85),0_0_40px_rgba(168,85,247,0.4),inset_0_1px_0_0_rgba(255,255,255,0.4)] overflow-hidden cursor-pointer backdrop-blur-3xl group"
            >
              {/* Dynamic Conic-Gradient Rainbow Prism Foil */}
              <motion.div
                className="pointer-events-none absolute -inset-10 opacity-55 mix-blend-color-dodge transition-opacity duration-300 group-hover:opacity-85"
                style={{
                  background: `conic-gradient(from 45deg at ${holoX} ${holoY}, #ec4899, #a855f7, #3b82f6, #06b6d4, #10b981, #eab308, #ec4899)`,
                  filter: "blur(18px)",
                }}
              />

              {/* Holographic Micro-Grating Diffraction Texture */}
              <div
                className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen"
                style={{
                  backgroundImage: "repeating-linear-gradient(115deg, transparent, transparent 3px, rgba(255,255,255,0.12) 3px, rgba(255,255,255,0.12) 5px)",
                }}
              />

              {/* Specular Glare overlay */}
              <motion.div
                className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
                style={{
                  background: `radial-gradient(circle at ${holoX} ${holoY}, rgba(255, 255, 255, 0.85) 0%, transparent 55%)`,
                }}
              />

              <div
                style={{ transform: "translateZ(35px)", transformStyle: "preserve-3d" }}
                className="relative z-10 flex h-full flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-black uppercase tracking-[0.25em] text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                      AURAIC HI-RES PASSPORT
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 font-bold bg-amber-400/15 px-2.5 py-0.5 rounded-full border border-amber-400/30 shadow-[0_0_12px_rgba(234,179,8,0.4)]">
                    <Sparkles className="h-3 w-3 animate-spin-slow" /> MASTER 24-BIT
                  </div>
                </div>

                {/* 3D Audiophile Microchip & User Info */}
                <div className="flex items-center justify-between gap-4 my-auto">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                      {currentUser?.name || currentUser?.email?.split("@")[0] || "Auraic Explorer"}
                    </h3>
                    <p className="text-xs text-white/70 mt-1 font-mono flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Certified Audiophile • 96kHz</span>
                    </p>
                  </div>

                  {/* 3D Gold / Hi-Res Metallic Microchip */}
                  <div
                    style={{ transform: "translateZ(25px)" }}
                    className="relative h-11 w-14 rounded-lg bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 p-1 shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.7)] border border-yellow-300/80 flex flex-col justify-between shrink-0"
                  >
                    <div className="h-0.5 w-full bg-yellow-800/40 rounded-full" />
                    <div className="flex justify-between items-center h-full px-1">
                      <div className="w-2.5 h-4 border-r border-yellow-800/40" />
                      <span className="text-[7px] font-mono font-black text-yellow-900/80 tracking-tighter">HI-RES</span>
                      <div className="w-2.5 h-4 border-l border-yellow-800/40" />
                    </div>
                    <div className="h-0.5 w-full bg-yellow-800/40 rounded-full" />
                  </div>
                </div>

                {/* Footer details & Barcode */}
                <div className="flex items-end justify-between border-t border-white/15 pt-3">
                  <div>
                    <span className="text-[9px] uppercase font-mono text-white/45">Gu Âm Nhạc</span>
                    <p className="text-xs font-bold text-violet-300">Chillout • Ambient</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-mono text-white/45">Thời Lượng</span>
                    <p className="text-xs font-bold text-cyan-300">148.5h Hi-Res</p>
                  </div>
                  <div className="text-right">
                    {/* Visual Barcode */}
                    <div className="flex gap-0.5 justify-end h-5 mb-1 opacity-70">
                      {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 3, 2, 1, 4].map((w, idx) => (
                        <span key={idx} className="bg-white rounded-xs h-full" style={{ width: `${w}px` }} />
                      ))}
                    </div>
                    <p className="font-mono text-[9px] text-white/50">AUR-9948-PRO</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* ========================================================= */}
      {/* 3. LISTENING HEATMAP SECTION                              */}
      {/* ========================================================= */}
      <section className="rounded-3xl border border-white/15 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-2xl shadow-xl">
        <ListeningHeatmap />
      </section>
    </div>
  );
}
