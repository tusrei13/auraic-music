"use client";

import React from "react";
import { motion } from "framer-motion";

interface RetroCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  screws?: boolean;
  glowOnHover?: boolean;
}

export default function RetroCard({
  children,
  className = "",
  onClick,
  screws = false,
  glowOnHover = true,
}: RetroCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`relative overflow-hidden rounded-[28px] border-2 border-white/15 bg-[#0e101c]/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-300 ${
        glowOnHover ? "hover:border-purple-500/50 hover:shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(168,85,247,0.25)]" : ""
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {screws && (
        <>
          <div className="retro-screw absolute top-3.5 left-3.5 z-20 pointer-events-none" />
          <div className="retro-screw absolute top-3.5 right-3.5 z-20 pointer-events-none" />
          <div className="retro-screw absolute bottom-3.5 left-3.5 z-20 pointer-events-none" />
          <div className="retro-screw absolute bottom-3.5 right-3.5 z-20 pointer-events-none" />
        </>
      )}
      {children}
    </motion.div>
  );
}
