"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

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

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 22, stiffness: 240, mass: 0.7 };
  const mouseXSpring = useSpring(x, springConfig);
  const mouseYSpring = useSpring(y, springConfig);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Glare position
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
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
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{
        scale: 1.03,
        boxShadow: `0 24px 50px -10px rgba(0, 0, 0, 0.65), 0 0 30px -4px ${glowColor}, inset 0 1px 0 0 rgba(255, 255, 255, 0.25)`,
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`relative cursor-pointer rounded-2xl border border-white/12 bg-white/[0.035] backdrop-blur-2xl transition-all duration-300 ${
        isHovered && neonBorder ? "border-white/30" : "border-white/12"
      } ${className}`}
    >
      {/* Dynamic Specular Glare Overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255, 255, 255, 0.18) 0%, transparent 60%)`,
        }}
      />

      {/* 3D Elevated Children Container */}
      <div
        style={{
          transform: `translateZ(${depthZ}px)`,
          transformStyle: "preserve-3d",
        }}
        className="relative z-10 h-full w-full"
      >
        {children}
      </div>
    </motion.div>
  );
}
