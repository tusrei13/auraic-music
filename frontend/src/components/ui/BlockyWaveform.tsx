"use client";

import React, { useRef, useState, useMemo } from "react";

interface BlockyWaveformProps {
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  isPlaying?: boolean;
  barCount?: number;
  className?: string;
  glowColor?: "white" | "purple" | "cyan";
}

// Generate static pseudo-random heights so waveform looks like real audio track
function generateHeights(count: number): number[] {
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    // sinusoidal variation with some randomness for realistic audio wave shape
    const progress = i / count;
    const base = Math.sin(progress * Math.PI) * 0.5 + 0.35;
    const ripple = Math.sin(progress * 12) * 0.15;
    const variation = Math.sin(i * 99) * 0.15;
    const h = Math.min(1, Math.max(0.2, base + ripple + variation));
    heights.push(Math.round(h * 100) / 100);
  }
  return heights;
}

export default function BlockyWaveform({
  currentTime,
  duration,
  onSeek,
  isPlaying = false,
  barCount = 36,
  className = "",
  glowColor = "white",
}: BlockyWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const heights = useMemo(() => generateHeights(barCount), [barCount]);

  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const activeBars = Math.floor(progress * barCount);

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek?.(ratio * duration);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, moveX / rect.width));
    setHoverIndex(Math.floor(ratio * barCount));
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handlePointerDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-between gap-[2px] sm:gap-[3px] h-9 px-1 cursor-pointer select-none group ${className}`}
      title="Bấm để tua bài hát"
    >
      {heights.map((height, i) => {
        const isPassed = i <= activeBars;
        const isHovered = hoverIndex !== null && i <= hoverIndex;
        const isPeak = isPassed && i === activeBars && isPlaying;

        // Visual height in px (max ~28px, min ~8px)
        const barHeight = Math.max(8, Math.round(height * 28));

        return (
          <div
            key={i}
            className="flex-1 flex items-center justify-center h-full"
          >
            <div
              style={{
                height: `${barHeight}px`,
              }}
              className={`w-full max-w-[5px] rounded-[1px] transition-all duration-100 ${
                isPassed
                  ? glowColor === "purple"
                    ? "bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.7)]"
                    : glowColor === "cyan"
                    ? "bg-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                    : "bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                  : isHovered
                  ? "bg-white/60"
                  : "bg-white/20 hover:bg-white/40"
              } ${isPeak ? "scale-y-125" : ""}`}
            />
          </div>
        );
      })}
    </div>
  );
}
