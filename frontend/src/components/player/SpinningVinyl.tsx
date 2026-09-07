"use client";

import React from "react";
import { motion } from "framer-motion";
import Artwork from "@/components/Artwork";

interface SpinningVinylProps {
  isPlaying: boolean;
  coverImage?: string;
  requesterAvatar?: string;
  requesterName?: string;
  size?: number;
}

export default function SpinningVinyl({
  isPlaying,
  coverImage,
  requesterAvatar,
  requesterName,
  size = 320,
}: SpinningVinylProps) {
  const centerImage = requesterAvatar || coverImage || "/favicon.ico";

  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center select-none"
    >
      {/* Outer ambient glow */}
      <div
        className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-1000 ${
          isPlaying ? "opacity-60 bg-gradient-to-tr from-violet-600/40 via-fuchsia-500/30 to-cyan-400/40" : "opacity-15 bg-purple-900/20"
        }`}
      />

      {/* Tonearm assembly */}
      <div className="pointer-events-none absolute -top-8 -right-6 z-30 h-40 w-32 origin-top-right">
        <motion.div
          animate={{ rotate: isPlaying ? 22 : 0 }}
          transition={{ type: "spring", damping: 18, stiffness: 80 }}
          className="relative h-full w-full origin-[85%_10%]"
        >
          {/* Base pivot */}
          <div className="absolute right-4 top-2 h-7 w-7 rounded-full border border-white/20 bg-gradient-to-br from-zinc-600 via-zinc-800 to-black shadow-lg" />
          {/* Arm bar */}
          <div className="absolute right-7 top-5 h-28 w-1.5 origin-top rotate-[-12deg] rounded-full bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-600 shadow-md" />
          {/* Cartridge & Stylus head */}
          <div className="absolute right-[2.35rem] top-32 h-6 w-3.5 rotate-[-5deg] rounded-sm border border-zinc-700 bg-zinc-900 shadow-md">
            <div className="absolute bottom-0 left-1/2 h-2 w-0.5 -translate-x-1/2 bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
          </div>
        </motion.div>
      </div>

      {/* Rotating Vinyl Disc */}
      <motion.div
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{
          rotate: {
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          },
        }}
        style={{ width: size, height: size }}
        className="relative rounded-full border-4 border-zinc-900/80 bg-[#09090b] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(255,255,255,0.05)] overflow-hidden"
      >
        {/* Micro-grooves concentric rings */}
        <div className="absolute inset-2 rounded-full border border-white/[0.04]" />
        <div className="absolute inset-5 rounded-full border border-white/[0.03]" />
        <div className="absolute inset-8 rounded-full border border-white/[0.05]" />
        <div className="absolute inset-12 rounded-full border border-white/[0.03]" />
        <div className="absolute inset-16 rounded-full border border-white/[0.04]" />
        <div className="absolute inset-20 rounded-full border border-white/[0.03]" />
        <div className="absolute inset-24 rounded-full border border-white/[0.05]" />

        {/* Realistic Vinyl Sheen (Reflections) */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.12) 0deg, transparent 55deg, rgba(255,255,255,0.08) 120deg, transparent 180deg, rgba(255,255,255,0.12) 240deg, transparent 300deg, rgba(255,255,255,0.08) 360deg)",
          }}
        />

        {/* Center label (Avatar / Artwork) */}
        <div
          style={{ width: size * 0.38, height: size * 0.38 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-500/40 p-1 bg-gradient-to-tr from-violet-950 via-zinc-900 to-indigo-950 shadow-inner"
        >
          <div className="relative h-full w-full overflow-hidden rounded-full border border-white/20">
            <Artwork
              src={centerImage}
              alt={requesterName ? `Requested by ${requesterName}` : "Vinyl Label"}
              className="h-full w-full object-cover"
            />
            {/* Requester tag badge */}
            {requesterName && (
              <div className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center text-[9px] font-bold text-cyan-300 backdrop-blur-xs truncate px-1">
                {requesterName}
              </div>
            )}
          </div>

          {/* Center spindle brass hole */}
          <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300 bg-zinc-950 shadow-inner" />
        </div>
      </motion.div>
    </div>
  );
}
