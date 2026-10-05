"use client";

import React, { useState, useRef } from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import {
  Activity,
  Download,
  Sparkles,
  Cpu,
  BarChart3,
  Award,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";

// =========================================================
// 1. SOUND RADAR CHART (THICK VECTOR OUTLINES & PIXEL LABELS)
// =========================================================
interface RadarAxis {
  label: string;
  value: number; // 0 - 100
}

const RADAR_AXES: RadarAxis[] = [
  { label: "VOCAL", value: 88 },
  { label: "CHILL", value: 94 },
  { label: "LOFI", value: 82 },
  { label: "ACOUSTIC", value: 75 },
  { label: "ELECTRONIC", value: 80 },
  { label: "ENERGETIC", value: 65 },
];

function SoundRadarChart({ axes = RADAR_AXES }: { axes?: RadarAxis[] }) {
  const size = 320;
  const center = size / 2;
  const radius = size * 0.36;
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
    <div className="relative flex flex-col items-center justify-center py-4 select-none">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id="radar2DGlowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
          </radialGradient>
          <filter id="vectorNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Thick Vector Web Polygons */}
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
              stroke={level === 1 ? "rgba(255, 255, 255, 0.35)" : "rgba(255, 255, 255, 0.12)"}
              strokeWidth={level === 1 ? 2.5 : 1.5}
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
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Data polygon with thick 2D vector outline & neon glow */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          points={points}
          fill="url(#radar2DGlowGrad)"
          stroke="#06b6d4"
          strokeWidth={3.5}
          filter="url(#vectorNeonGlow)"
        />

        {/* Glowing Neon Nodes (Crisp Circles) */}
        {axes.map((axis, i) => {
          const { x, y } = getCoordinates(i, axis.value);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={7}
                fill="#ffffff"
                stroke="#c084fc"
                strokeWidth={2.5}
                className="filter drop-shadow-[0_0_8px_rgba(192,132,252,0.9)]"
              />
              <circle
                cx={x}
                cy={y}
                r={3}
                fill="#000000"
              />
            </g>
          );
        })}

        {/* Bold Pixel Attribute Labels (VOCAL, CHILL, LOFI...) */}
        {axes.map((axis, i) => {
          const { x, y } = getCoordinates(i, 122);
          return (
            <text
              key={i}
              x={x}
              y={y + 4}
              textAnchor="middle"
              className="fill-white font-pixel text-xs font-bold tracking-wider drop-shadow-md"
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
// 2. LISTENING HEATMAP (CRISP SQUARE PIXEL BLOCKS & NEON)
// =========================================================
function ListeningHeatmap() {
  const weeks = 22;
  const days = 7;
  const [hoveredCell, setHoveredCell] = useState<{
    day: number;
    week: number;
    minutes: number;
  } | null>(null);

  const getActivity = (w: number, d: number) => {
    const val = (Math.sin(w * 1.5 + d) * 1000) % 5;
    const level = Math.floor(Math.abs(val));
    const minutes = level * 35 + ((w * 7 + d) % 20);
    return { level, minutes };
  };

  const getCellColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-purple-950 border border-purple-800/60";
      case 2:
        return "bg-purple-600 border border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]";
      case 3:
        return "bg-cyan-400 border border-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.6)]";
      case 4:
        return "bg-white border-2 border-cyan-300 shadow-[0_0_14px_rgba(255,255,255,0.9)]";
      default:
        return "bg-white/[0.04] border border-white/[0.08]";
    }
  };

  return (
    <div className="space-y-4 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <span className="font-pixel text-white/80">ACTIVITY MATRIX: DAILY STREAM LOGS</span>
        <div className="flex items-center gap-1.5 font-arcade text-[10px] text-white/60">
          <span>ÍT</span>
          <span className="h-3 w-3 rounded-xs bg-white/[0.04] border border-white/10" />
          <span className="h-3 w-3 rounded-xs bg-purple-950 border border-purple-800" />
          <span className="h-3 w-3 rounded-xs bg-purple-600 border border-purple-400" />
          <span className="h-3 w-3 rounded-xs bg-cyan-400 border border-cyan-200" />
          <span className="h-3 w-3 rounded-xs bg-white border border-cyan-300" />
          <span>NHIỀU</span>
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
                className={`h-4 w-4 cursor-pointer rounded-xs transition-colors duration-150 ${getCellColor(
                  level
                )}`}
              />
            );
          })}
        </div>
      </div>

      {hoveredCell ? (
        <p className="font-arcade text-xs text-cyan-300">
          Tuần {hoveredCell.week + 1}, Ngày {hoveredCell.day + 1}:{" "}
          <span className="font-bold text-white">{hoveredCell.minutes} phút nghe nhạc</span>
        </p>
      ) : (
        <p className="font-arcade text-xs text-white/40">
          Rê chuột lên các pixel block để xem chi tiết thời lượng
        </p>
      )}
    </div>
  );
}

// =========================================================
// 3. 2D RETRO ARCADE PASS CARD (PLAYER PASSPORT)
// =========================================================
export default function StatsPage() {
  const currentUser = useAuthStore((s) => s.user);
  const { addToast } = useToastStore();

  const [exporting, setExporting] = useState(false);

  // 3D Tilt for Arcade Passport Card
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const spring = { damping: 22, stiffness: 220 };
  const mouseXSpring = useSpring(x, spring);
  const mouseYSpring = useSpring(y, spring);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-12, 12]);

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

      // Dark Chassis Background
      ctx.fillStyle = "#0c0d16";
      ctx.fillRect(0, 0, width, height);

      // Card border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.strokeRect(12, 12, width - 24, height - 24);

      // Header Tag
      ctx.fillStyle = "#a855f7";
      ctx.font = "bold 14px monospace";
      ctx.fillText("AURAIC RETRO ARCADE PASS", 40, 50);

      const name = currentUser?.name || currentUser?.email?.split("@")[0] || "Auraic Explorer";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 26px monospace";
      ctx.fillText(name, 40, 95);

      // Golden microchip
      ctx.fillStyle = "#eab308";
      ctx.fillRect(40, 115, 60, 44);
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 115, 60, 44);

      // Status text
      ctx.fillStyle = "#06b6d4";
      ctx.font = "bold 16px monospace";
      ctx.fillText("RANK: AUDIOPHILE S-CLASS", 120, 145);

      // Stats
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "12px monospace";
      ctx.fillText("Gu nhạc chính", 40, 210);
      ctx.fillText("Thời lượng nghe", 240, 210);
      ctx.fillText("Chuẩn xác", 440, 210);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px monospace";
      ctx.fillText("Lofi • Chill • Synth", 40, 240);
      ctx.fillText("148.5 Giờ", 240, 240);
      ctx.fillText("99.4% Hi-Res", 440, 240);

      // Barcode
      ctx.fillStyle = "#ffffff";
      for (let i = 40; i < width - 40; i += 6) {
        const barW = (i % 12 === 0) ? 3.5 : 1.5;
        ctx.fillRect(i, 300, barW, 40);
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "11px monospace";
      ctx.fillText("AUR-9948-ARCADE-S-CLASS", 40, 365);

      const link = document.createElement("a");
      link.download = `auraic-arcade-pass-${name.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      addToast("Đã xuất thẻ Retro Arcade Pass thành công!", "success");
    } catch {
      addToast("Lỗi khi tạo ảnh Passport", "error");
    } finally {
      setExporting(false);
    }
  };

  const userName = currentUser?.name || currentUser?.email?.split("@")[0] || "Auraic Explorer";

  return (
    <div className="min-h-full px-4 pb-36 pt-4 text-white sm:px-8 lg:px-12 space-y-12">
      {/* 2D HARDWARE CONSOLE HEADER */}
      <section className="relative overflow-hidden rounded-[36px] border-2 border-white/15 bg-[#0d0f1b]/95 p-6 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.2)]">
        <div className="retro-screw absolute top-4 left-4" />
        <div className="retro-screw absolute top-4 right-4" />
        <div className="retro-screw absolute bottom-4 left-4" />
        <div className="retro-screw absolute bottom-4 right-4" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-950/40 px-3.5 py-1 text-xs font-arcade font-bold text-cyan-300">
            <Activity className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
            <span>2D VECTOR AUDIO ANALYTICS & TASTE DNA</span>
          </div>

          <h1 className="font-pixel text-3xl sm:text-5xl font-black tracking-tight text-white">
            Thống Kê Gu Nhạc
          </h1>

          <p className="font-arcade text-xs sm:text-sm text-white/60 tracking-wider leading-relaxed">
            Phân tích 6 trục thẩm mỹ âm nhạc qua biểu đồ Vector Radar dày, nhật ký hoạt động pixel blocks và thẻ định danh Retro Arcade Pass Card.
          </p>
        </div>
      </section>

      {/* TWO COLUMN GRID: RADAR CHART + RETRO ARCADE PASS CARD */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-start">
        {/* ================= 1. SOUND RADAR CHART ================= */}
        <section className="relative overflow-hidden rounded-[32px] border-2 border-white/15 bg-[#0e101c]/95 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)] space-y-6">
          <div className="retro-screw absolute top-3.5 left-3.5" />
          <div className="retro-screw absolute top-3.5 right-3.5" />
          <div className="retro-screw absolute bottom-3.5 left-3.5" />
          <div className="retro-screw absolute bottom-3.5 right-3.5" />

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-pixel text-xl sm:text-2xl font-bold tracking-tight text-white">
                Sound Radar Chart
              </h2>
              <p className="font-arcade text-xs text-white/50 tracking-wider">
                Đồ thị vector 6 trục thẩm mỹ dải âm
              </p>
            </div>
            <span className="rounded-full border border-white bg-white text-black font-pixel font-bold px-3 py-1 text-xs shadow-md">
              CHILLOUT 94%
            </span>
          </div>

          <SoundRadarChart />

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="rounded-2xl border-2 border-white/10 bg-black/40 p-3 text-center">
              <span className="font-arcade text-[10px] text-white/40 uppercase tracking-wider">TOP GENRE</span>
              <p className="font-pixel font-bold text-sm text-cyan-300 mt-1">Chill / Lofi</p>
            </div>
            <div className="rounded-2xl border-2 border-white/10 bg-black/40 p-3 text-center">
              <span className="font-arcade text-[10px] text-white/40 uppercase tracking-wider">BPM RANGE</span>
              <p className="font-pixel font-bold text-sm text-purple-300 mt-1">75 - 90 BPM</p>
            </div>
            <div className="rounded-2xl border-2 border-white/10 bg-black/40 p-3 text-center">
              <span className="font-arcade text-[10px] text-white/40 uppercase tracking-wider">HI-FI LEVEL</span>
              <p className="font-pixel font-bold text-sm text-amber-300 mt-1">94.2% FLAC</p>
            </div>
          </div>
        </section>

        {/* ================= 2. RETRO ARCADE PASS CARD ================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-pixel text-xl sm:text-2xl font-bold tracking-tight text-white">
                Player Passport Card
              </h2>
              <p className="font-arcade text-xs text-white/50 tracking-wider">
                Thẻ định danh phong cách Arcade 2D Vector
              </p>
            </div>
            <button
              onClick={handleExportPNG}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-white bg-white text-black px-4 py-2 font-pixel text-xs font-bold shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? "ĐANG XUẤT..." : "TẢI PNG"}</span>
            </button>
          </div>

          <div
            className="perspective-1000 select-none py-2"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              ref={cardRef}
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }}
              className="relative overflow-hidden rounded-[32px] border-2 border-white/20 bg-gradient-to-br from-[#1a1728] via-[#0f111e] to-[#070912] p-7 sm:p-9 shadow-[0_30px_70px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.3)] transition-shadow duration-300"
            >
              {/* Corner Screws on the Passport Card */}
              <div className="retro-screw absolute top-3.5 left-3.5" />
              <div className="retro-screw absolute top-3.5 right-3.5" />
              <div className="retro-screw absolute bottom-3.5 left-3.5" />
              <div className="retro-screw absolute bottom-3.5 right-3.5" />

              {/* Holographic Sheen Layer */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-cyan-400/10 to-transparent mix-blend-screen opacity-70" />

              <div className="relative z-10 space-y-6">
                {/* Header Tag & Issuer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-arcade text-[11px] font-bold text-cyan-300 tracking-widest uppercase">
                      AURAIC MUSIC ARCHIVE
                    </span>
                  </div>
                  <span className="font-pixel text-xs text-white/50 tracking-wider">
                    NO. 2026-HI-RES
                  </span>
                </div>

                {/* User Name & Golden Microchip */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-pixel text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                      {userName}
                    </h3>
                    {/* Pixel Status Text: RANK: AUDIOPHILE S-CLASS */}
                    <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-cyan-400/40 bg-cyan-950/60 text-cyan-300 font-pixel text-xs font-bold tracking-wide">
                      <Award className="w-3.5 h-3.5 text-cyan-300" />
                      <span>RANK: AUDIOPHILE S-CLASS</span>
                    </div>
                  </div>

                  {/* Golden Microchip Icon */}
                  <div className="relative h-12 w-16 shrink-0 rounded-lg border-2 border-amber-400/80 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 shadow-[0_0_15px_rgba(234,179,8,0.5)] p-1 flex items-center justify-center">
                    <div className="h-full w-full rounded border border-amber-900/60 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-amber-950" />
                    </div>
                  </div>
                </div>

                {/* Passport Key Attributes */}
                <div className="grid grid-cols-3 gap-3 pt-1 border-t-2 border-white/10 font-arcade">
                  <div>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider block">GU NHẠC</span>
                    <span className="font-pixel text-xs font-bold text-white mt-1 block">Chill • Lofi</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider block">TỔNG GIỜ</span>
                    <span className="font-pixel text-xs font-bold text-white mt-1 block">148.5H</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider block">HI-RES</span>
                    <span className="font-pixel text-xs font-bold text-cyan-300 mt-1 block">99.4% S-RANK</span>
                  </div>
                </div>

                {/* Bottom Barcode */}
                <div className="pt-2">
                  <div className="flex items-center gap-1 h-8 w-full opacity-80">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <span
                        key={i}
                        className={`bg-white rounded-xs ${
                          i % 3 === 0 ? "w-1.5 h-8" : i % 2 === 0 ? "w-0.5 h-6" : "w-1 h-7"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="font-arcade text-[9px] text-white/40 tracking-[0.2em] mt-1">
                    AUR-9948-ARCADE-S-CLASS-PASS
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* ================= 3. LISTENING HEATMAP MATRIX ================= */}
      <section className="relative overflow-hidden rounded-[32px] border-2 border-white/15 bg-[#0e101c]/95 p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.2)] space-y-4">
        <div className="retro-screw absolute top-3.5 left-3.5" />
        <div className="retro-screw absolute top-3.5 right-3.5" />
        <div className="retro-screw absolute bottom-3.5 left-3.5" />
        <div className="retro-screw absolute bottom-3.5 right-3.5" />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-pixel text-xl sm:text-2xl font-bold tracking-tight text-white">
              Activity Heatmap Matrix
            </h2>
            <p className="font-arcade text-xs text-white/50 tracking-wider">
              Lưới pixel thể hiện cường độ nghe nhạc qua các tuần
            </p>
          </div>
          <span className="font-arcade text-xs text-cyan-300">
            Pixel Block Grid
          </span>
        </div>

        <ListeningHeatmap />
      </section>
    </div>
  );
}
