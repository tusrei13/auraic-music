"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useAdaptiveGraphics } from "@/hooks/useAdaptiveGraphics";

export interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  maxTilt?: number;
  depthZ?: number;
  neonBorder?: boolean;
  onClick?: () => void;
}

export default function Card3D({
  children,
  className = "",
  glowColor = "rgba(168, 85, 247, 0.45)",
  maxTilt = 12,
  depthZ = 16,
  neonBorder = true,
  onClick,
}: Card3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  // Adaptive graphics: on low-spec / low-FPS tier the 3D tilt is switched off
  // so the GPU only pays for compositing, never per-frame perspective work.
  const { quality } = useAdaptiveGraphics();
  const tiltEnabled = quality === "high";

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 22, stiffness: 240, mass: 0.7 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Glare position (paint-only overlay, never layout).
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltEnabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={tiltEnabled ? handleMouseMove : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX: tiltEnabled ? rotateX : 0,
        rotateY: tiltEnabled ? rotateY : 0,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`relative cursor-pointer overflow-hidden rounded-2xl border bg-white/[0.03] will-change-transform transform-gpu transition-[background-color,border-color] duration-300 hover:bg-white/[0.08] ${
        isHovered && neonBorder && tiltEnabled
          ? "border-white/30"
          : "border-white/10 hover:border-white/20"
      } ${className}`}
    >
      {/* Pre-rendered ambient glow layer — cheaper than per-frame box-shadow. */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-0 transition-opacity duration-300 will-change-transform"
        style={{ boxShadow: `0 24px 50px -10px rgba(0, 0, 0, 0.65), 0 0 30px -4px ${glowColor}, inset 0 1px 0 0 rgba(255, 255, 255, 0.25)` }}
        animate={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Dynamic Specular Glare Overlay */}
      {tiltEnabled && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255, 255, 255, 0.18) 0%, transparent 60%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
        />
      )}

      {/* 3D Elevated Children Container */}
      <div
        style={{
          transform: `translateZ(${depthZ}px)`,
          transformStyle: "preserve-3d",
        }}
        className="relative z-10 h-full w-full will-change-transform"
      >
        {children}
      </div>
    </motion.div>
  );
}