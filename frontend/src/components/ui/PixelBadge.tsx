"use client";

import React from "react";
import { MessageSquare } from "lucide-react";

interface PixelBadgeProps {
  count?: number | string;
  icon?: React.ReactNode;
  label?: string;
  prefix?: string;
  variant?: "bubble" | "pill" | "outline" | "neon";
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function PixelBadge({
  count,
  icon,
  label,
  prefix = "+",
  variant = "bubble",
  className = "",
  onClick,
}: PixelBadgeProps) {
  const displayText = count !== undefined ? `${prefix} ${count}` : label;

  if (variant === "bubble") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-arcade text-xs tracking-wider transition-all select-none shadow-sm ${
          onClick ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default"
        } ${className}`}
      >
        {icon || <MessageSquare className="w-3.5 h-3.5 fill-white text-white opacity-90" />}
        <span className="font-bold">{displayText}</span>
      </button>
    );
  }

  if (variant === "pill") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-white/20 bg-white/5 font-arcade text-[11px] tracking-wider text-white/90 ${className}`}
      >
        {icon}
        <span>{displayText}</span>
      </span>
    );
  }

  if (variant === "neon") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-purple-400/40 bg-purple-950/40 text-purple-300 font-arcade text-[11px] tracking-wider shadow-[0_0_12px_rgba(168,85,247,0.35)] ${className}`}
      >
        {icon}
        <span>{displayText}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border border-white/15 bg-black/40 text-white/80 font-arcade text-[10px] tracking-wider ${className}`}
    >
      {icon}
      <span>{displayText}</span>
    </span>
  );
}
