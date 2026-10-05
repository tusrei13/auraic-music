"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Artwork from "@/components/Artwork";

interface RetroTurntableDeckProps {
  isPlaying: boolean;
  onTogglePlay?: () => void;
  trackTitle?: string;
  artistName?: string;
  coverImage?: string;
  className?: string;
}

export default function RetroTurntableDeck({
  isPlaying,
  onTogglePlay,
  trackTitle = "The Suffering",
  artistName = "Auraic Sound Engine",
  coverImage,
  className = "",
}: RetroTurntableDeckProps) {
  const [speed, setSpeed] = useState<33 | 45>(33);
  const [powerOn, setPowerOn] = useState(true);

  const spinDuration = speed === 33 ? 2.5 : 1.8;

  return (
    <div
      className={`relative select-none rounded-[36px] border-2 border-white/20 bg-gradient-to-b from-[#8f96a3] via-[#4d5360] to-[#252830] p-4 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-2px_6px_rgba(0,0,0,0.6)] ${className}`}
    >
      {/* Ambient Purple/Neon Underglow */}
      <div
        className="pointer-events-none absolute -inset-2 -z-10 rounded-[40px] opacity-40 blur-2xl transition-opacity duration-700"
        style={{
          background: isPlaying
            ? "radial-gradient(circle, rgba(168,85,247,0.5) 0%, rgba(6,182,212,0.3) 50%, transparent 75%)"
            : "radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 60%)",
        }}
      />

      {/* 4 Chassis Screws */}
      <div className="retro-screw absolute top-4 left-4" />
      <div className="retro-screw absolute top-4 right-4" />
      <div className="retro-screw absolute bottom-4 left-4" />
      <div className="retro-screw absolute bottom-4 right-4" />

      {/* Rim Screws (Reference Image Accents) */}
      <div className="retro-screw absolute top-3 left-1/2 -translate-x-1/2 scale-75 opacity-70" />
      <div className="retro-screw absolute bottom-3 left-1/2 -translate-x-1/2 scale-75 opacity-70" />

      {/* Main Turntable Console Face */}
      <div className="relative aspect-square w-full rounded-[28px] bg-gradient-to-br from-[#232731] via-[#1a1c24] to-[#12141a] p-3 sm:p-5 border border-white/10 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
        
        {/* Circular Platter Recess */}
        <div className="relative h-[92%] w-[92%] rounded-full bg-gradient-to-b from-[#181a22] to-[#0c0d12] p-2.5 shadow-[inset_0_8px_20px_rgba(0,0,0,0.95),0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-center">
          
          {/* Strobe dots outer platter ring */}
          <div className="absolute inset-0 rounded-full border-[6px] border-[#2d313d] shadow-inner" />
          <div className="absolute inset-1 rounded-full retro-strobe-dots opacity-30" />

          {/* Strobe red LED sensor (bottom-left) */}
          <div className="absolute bottom-5 left-5 z-20 flex flex-col items-center gap-1">
            <span
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                isPlaying && powerOn
                  ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-pulse"
                  : "bg-red-950 border border-red-800"
              }`}
            />
            <span className="text-[7px] font-arcade text-white/40 tracking-tighter">STROBE</span>
          </div>

          {/* Rotating Vinyl Record */}
          <motion.div
            animate={isPlaying && powerOn ? { rotate: 360 } : { rotate: 0 }}
            transition={{
              rotate: {
                duration: spinDuration,
                repeat: Infinity,
                ease: "linear",
              },
            }}
            onClick={onTogglePlay}
            className="relative h-[86%] w-[86%] rounded-full bg-[#0a0a0d] shadow-[0_15px_35px_rgba(0,0,0,0.95)] border-2 border-neutral-900 cursor-pointer overflow-hidden flex items-center justify-center group"
          >
            {/* Micro-grooves Rings */}
            <div className="pointer-events-none absolute inset-2 rounded-full border border-white/[0.04]" />
            <div className="pointer-events-none absolute inset-6 rounded-full border border-white/[0.03]" />
            <div className="pointer-events-none absolute inset-10 rounded-full border border-white/[0.05]" />
            <div className="pointer-events-none absolute inset-14 rounded-full border border-white/[0.03]" />
            <div className="pointer-events-none absolute inset-20 rounded-full border border-white/[0.04]" />
            <div className="pointer-events-none absolute inset-24 rounded-full border border-white/[0.02]" />

            {/* Realistic Vinyl Sheen Reflected Angles */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.15) 0deg, transparent 55deg, rgba(255,255,255,0.08) 120deg, transparent 180deg, rgba(255,255,255,0.15) 240deg, transparent 300deg, rgba(255,255,255,0.08) 360deg)",
              }}
            />

            {/* Center Label (33 1/3 RPM or Artwork) */}
            <div className="relative h-[38%] w-[38%] rounded-full border-2 border-[#d1d5db] bg-[#eae6df] text-black shadow-inner flex flex-col items-center justify-center p-1 text-center overflow-hidden">
              {coverImage ? (
                <div className="relative h-full w-full rounded-full overflow-hidden">
                  <Artwork
                    src={coverImage}
                    alt={trackTitle}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-[8px] font-arcade font-bold text-white uppercase tracking-wider drop-shadow-md">
                      {speed}⅓ RPM
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-[10px] font-arcade font-bold tracking-tight text-neutral-800">
                    AURAIC
                  </span>
                  <span className="text-[7px] font-arcade font-extrabold text-neutral-700 mt-0.5 max-w-[80px] truncate text-center">
                    {artistName}
                  </span>
                  <span className="text-[6px] font-arcade text-neutral-500 uppercase mt-0.5">
                    {speed}⅓ RPM
                  </span>
                </>
              )}

              {/* Center Spindle Hole */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border border-neutral-700 bg-neutral-900 shadow-inner flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Realistic Tonearm Assembly (Top Right) */}
        <div className="pointer-events-none absolute top-4 right-4 z-30 h-44 w-32 origin-top-right sm:h-52 sm:w-36">
          <motion.div
            animate={{ rotate: isPlaying && powerOn ? 24 : 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 75 }}
            className="relative h-full w-full origin-[80%_12%]"
          >
            {/* Gimbal / Pivot Base */}
            <div className="absolute right-5 top-2 h-10 w-10 rounded-full border-2 border-[#94a3b8] bg-gradient-to-br from-[#cbd5e1] via-[#64748b] to-[#1e293b] shadow-lg flex items-center justify-center">
              <div className="h-5 w-5 rounded-full border border-black/40 bg-gradient-to-tr from-[#334155] to-[#94a3b8] shadow-inner" />
            </div>

            {/* Counterweight */}
            <div className="absolute right-7 -top-2 h-6 w-7 rounded-sm border border-neutral-700 bg-gradient-to-r from-neutral-600 via-neutral-300 to-neutral-700 shadow-md" />

            {/* Cueing Lever */}
            <div className="absolute right-12 top-6 h-6 w-1 rounded-full bg-neutral-400 shadow-sm rotate-[25deg]" />

            {/* Tonearm Bar (S-curved / straight metallic) */}
            <div className="absolute right-8 top-8 h-32 w-2 origin-top rotate-[-12deg] rounded-full bg-gradient-to-b from-[#e2e8f0] via-[#94a3b8] to-[#475569] shadow-md" />

            {/* Headshell & Stylus Cartridge (Vintage Silver Perforated Style) */}
            <div className="absolute right-[2.6rem] top-36 h-9 w-5 rotate-[-5deg] rounded-sm border border-neutral-600 bg-gradient-to-b from-[#cbd5e1] to-[#475569] shadow-lg flex flex-col items-center justify-between p-0.5">
              {/* Headshell slots */}
              <div className="flex gap-0.5 mt-0.5">
                <span className="w-0.5 h-2 bg-black/60 rounded-full" />
                <span className="w-0.5 h-2 bg-black/60 rounded-full" />
                <span className="w-0.5 h-2 bg-black/60 rounded-full" />
              </div>

              {/* Stylus needle & LED glow */}
              <div className="relative w-full flex justify-center pb-0.5">
                <div
                  className={`h-2.5 w-1 rounded-b-sm bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.9)] ${
                    isPlaying ? "animate-pulse" : ""
                  }`}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Power Toggle Switch & RPM Knobs (Bottom Right Deck) */}
        <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
          {/* Speed Selector (33 / 45) */}
          <div className="flex items-center gap-1 bg-black/60 rounded-lg p-1 border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setSpeed(33)}
              className={`px-1.5 py-0.5 rounded text-[8px] font-arcade transition-all cursor-pointer ${
                speed === 33
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              33
            </button>
            <button
              type="button"
              onClick={() => setSpeed(45)}
              className={`px-1.5 py-0.5 rounded text-[8px] font-arcade transition-all cursor-pointer ${
                speed === 45
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              45
            </button>
          </div>

          {/* Rotary Power Switch Knob */}
          <button
            type="button"
            onClick={() => {
              setPowerOn(!powerOn);
              if (isPlaying && powerOn && onTogglePlay) onTogglePlay();
            }}
            className="group flex flex-col items-center cursor-pointer"
            title="Bật/Tắt mâm đĩa than"
          >
            <div className="relative h-7 w-7 rounded-full border border-white/30 bg-gradient-to-br from-[#94a3b8] via-[#475569] to-[#0f172a] shadow-md flex items-center justify-center group-hover:scale-105 transition-transform">
              <div
                className={`h-4 w-1 rounded-full bg-white transition-transform duration-300 ${
                  powerOn ? "rotate-45" : "-rotate-45 bg-red-400"
                }`}
              />
            </div>
            <span className="text-[7px] font-arcade tracking-tight text-white/50 mt-0.5 uppercase">
              {powerOn ? "PWR ON" : "OFF"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
