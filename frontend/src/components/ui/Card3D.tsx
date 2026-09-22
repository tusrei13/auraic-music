"use client";

import React, { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
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
  depthZ = 30,
  neonBorder = true,
  onClick,
}: Card3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const quickToRef = useRef<{
    qX: (value: number) => void;
    qY: (value: number) => void;
    qScale: (value: number) => void;
  } | null>(null);

  const [isHovered, setIsHovered] = useState(false);
  const { quality } = useAdaptiveGraphics();
  const tiltEnabled = quality === "high";

  useGSAP(() => {
    if (!tiltEnabled || !containerRef.current) return;

    const qX = gsap.quickTo(containerRef.current, "rotateY", {
      duration: 0.4,
      ease: "power3.out",
      force3D: true,
    });
    const qY = gsap.quickTo(containerRef.current, "rotateX", {
      duration: 0.4,
      ease: "power3.out",
      force3D: true,
    });
    const qScale = gsap.quickTo(containerRef.current, "scale", {
      duration: 0.4,
      ease: "power3.out",
      force3D: true,
    });

    quickToRef.current = { qX, qY, qScale };
  }, [tiltEnabled]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltEnabled || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;

    const qs = quickToRef.current;
    if (qs) {
      qs.qY(maxTilt * -yPct);
      qs.qX(maxTilt * xPct);
      qs.qScale(1.03);
    }

    if (glareRef.current) {
      gsap.set(glareRef.current, {
        backgroundPosition: `${50 + xPct * 100}% ${50 + yPct * 100}%`,
      });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!tiltEnabled) return;
    if (glowRef.current) {
      gsap.to(glowRef.current, { opacity: 1, duration: 0.3 });
    }
    if (glareRef.current) {
      gsap.to(glareRef.current, { opacity: 1, duration: 0.3 });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!tiltEnabled || !containerRef.current) return;
    const qs = quickToRef.current;
    if (qs) {
      gsap.to(containerRef.current, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 1.2,
        ease: "elastic.out(1, 0.5)",
        force3D: true,
      });
    }
    if (glareRef.current) {
      gsap.to(glareRef.current, { opacity: 0, duration: 0.3 });
    }
    if (glowRef.current) {
      gsap.to(glowRef.current, { opacity: 0, duration: 0.3 });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={tiltEnabled ? handleMouseMove : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`relative cursor-pointer overflow-hidden rounded-2xl border bg-white/[0.03] will-change-transform transform-gpu transition-[background-color,border-color] duration-300 hover:bg-white/[0.08] ${
        isHovered && neonBorder && tiltEnabled
          ? "border-white/30"
          : "border-white/10 hover:border-white/20"
      } ${className}`}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
    >
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-0 will-change-transform"
        style={{
          boxShadow: `0 24px 50px -10px rgba(0, 0, 0, 0.65), 0 0 30px -4px ${glowColor}, inset 0 1px 0 0 rgba(255, 255, 255, 0.25)`,
        }}
      />

      {tiltEnabled && (
        <div
          ref={glareRef}
          className="pointer-events-none absolute inset-0 z-20 rounded-2xl opacity-0"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.18) 0%, transparent 60%)",
            backgroundSize: "200% 200%",
          }}
        />
      )}

      <div
        ref={innerRef}
        style={{ transform: `translateZ(${depthZ}px)`, transformStyle: "preserve-3d" }}
        className="relative z-10 h-full w-full will-change-transform"
      >
        {children}
      </div>
    </div>
  );
}
