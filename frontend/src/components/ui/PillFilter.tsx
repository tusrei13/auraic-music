"use client";

import React from "react";

interface PillFilterProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
  icon?: React.ReactNode;
  className?: string;
}

export default function PillFilter({
  label,
  active = false,
  onClick,
  count,
  icon,
  className = "",
}: PillFilterProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-pixel tracking-wide transition-all duration-200 select-none cursor-pointer whitespace-nowrap ${
        active
          ? "border-2 border-white bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105"
          : "border border-white/30 bg-transparent text-white/80 hover:border-white hover:text-white hover:bg-white/[0.06]"
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`text-[10px] font-arcade px-2 py-0.5 rounded-full ${
            active ? "bg-black/20 text-black font-bold" : "bg-white/10 text-white/70"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
