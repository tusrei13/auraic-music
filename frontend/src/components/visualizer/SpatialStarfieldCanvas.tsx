"use client";

import React, { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";

interface Particle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  vx: number;
  vy: number;
  pulseSpeed: number;
  pulsePhase: number;
  hueOffset: number;
}

export default function SpatialStarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Check reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Create celestial floating dust particles with dynamic density
    const particleCount = Math.min(Math.floor((width * height) / 10000), 150);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const baseAlpha = 0.25 + Math.random() * 0.55;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1.2 + Math.random() * 2.6,
        alpha: baseAlpha,
        baseAlpha,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.28 - 0.12, // Subtle upward floating draft
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulsePhase: Math.random() * Math.PI * 2,
        hueOffset: Math.random() * 50 - 25,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      const playing = isPlayingRef.current;
      const speedMultiplier = playing ? 1.4 : 0.85;

      // Draw subtle ambient connection filaments
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 85) {
            const filamentAlpha = (1 - dist / 85) * 0.07 * (playing ? 1.3 : 0.8);
            ctx.strokeStyle = `rgba(168, 85, 247, ${filamentAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw each particle with soft glowing aura
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Motion physics with gentle sway
        p.x += p.vx * speedMultiplier + Math.sin(time + p.pulsePhase) * 0.12;
        p.y += p.vy * speedMultiplier;

        // Wrap around viewport edges seamlessly
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Luminance breathing
        p.pulsePhase += p.pulseSpeed * (playing ? 1.6 : 1);
        const breath = Math.sin(p.pulsePhase) * 0.25;
        p.alpha = Math.max(0.08, Math.min(0.85, p.baseAlpha + breath));

        // Draw soft glow ring
        const glowRad = p.size * (playing ? 3.5 : 2.5);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRad);
        grad.addColorStop(0, `rgba(216, 180, 254, ${p.alpha * 0.9})`);
        grad.addColorStop(0.4, `rgba(147, 197, 253, ${p.alpha * 0.45})`);
        grad.addColorStop(1, "rgba(99, 102, 241, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // Core star point
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, p.alpha * 1.3)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Deep Cosmic Nebula Mesh Gradients - Multi-layered & Vibrant */}
      <div
        className="absolute -top-40 -left-40 h-[750px] w-[750px] rounded-full opacity-55 blur-[140px] animate-pulse transition-all duration-1000"
        style={{
          background: "radial-gradient(circle, var(--auraic-accent, #9333ea) 0%, rgba(99,102,241,0.5) 45%, transparent 75%)",
          animationDuration: "8s",
        }}
      />
      <div
        className="absolute top-1/4 -right-40 h-[850px] w-[850px] rounded-full opacity-45 blur-[160px] animate-pulse transition-all duration-1000"
        style={{
          background: "radial-gradient(circle, #06b6d4 0%, rgba(139,92,246,0.4) 40%, transparent 75%)",
          animationDuration: "11s",
        }}
      />
      <div
        className="absolute -bottom-48 left-1/3 h-[800px] w-[800px] rounded-full opacity-40 blur-[150px] animate-pulse transition-all duration-1000"
        style={{
          background: "radial-gradient(circle, #ec4899 0%, rgba(124,58,237,0.35) 45%, transparent 70%)",
          animationDuration: "9s",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[900px] w-[900px] rounded-full opacity-25 blur-[180px]"
        style={{
          background: "radial-gradient(circle, rgba(147,51,234,0.3) 0%, rgba(6,182,212,0.2) 50%, transparent 75%)",
        }}
      />

      {/* Floating 3D Starfield & Dust Particles Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-95"
      />
    </div>
  );
}
