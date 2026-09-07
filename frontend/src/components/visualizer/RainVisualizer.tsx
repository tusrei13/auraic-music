"use client";

import React, { useEffect, useRef } from "react";
import { ambientEngine } from "@/lib/ambientEngine";
import { usePlayerStore } from "@/store/usePlayerStore";

interface RainVisualizerProps {
  className?: string;
  themeColor?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  baseOpacity: number;
  hue: number;
}

interface Droplet {
  x: number;
  y: number;
  radius: number;
  trail: number;
  speed: number;
  wobble: number;
}

export default function RainVisualizer({
  className = "",
  themeColor = "#a855f7",
}: RainVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particles (Luminous floating dust)
    const particleCount = 45;
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1 + Math.random() * 2.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -0.2 - Math.random() * 0.6,
      opacity: 0.2 + Math.random() * 0.6,
      baseOpacity: 0.2 + Math.random() * 0.6,
      hue: Math.random() > 0.5 ? 270 : 190,
    }));

    // Condensation water droplets on glass
    const dropletCount = 28;
    const droplets: Droplet[] = Array.from({ length: dropletCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 2 + Math.random() * 5,
      trail: Math.random() * 12,
      speed: 0.05 + Math.random() * 0.15,
      wobble: Math.random() * Math.PI * 2,
    }));

    const freqData = new Uint8Array(64);

    const render = () => {
      animId = requestAnimationFrame(render);

      // Read audio frequency if available
      let bassEnergy = 0.2;
      const analyser = ambientEngine.getAnalyser();
      if (analyser) {
        analyser.getByteFrequencyData(freqData);
        // Average the first 6 low-frequency bins (Bass)
        let sum = 0;
        for (let i = 0; i < 6; i++) sum += freqData[i];
        bassEnergy = Math.max(0.15, (sum / 6 / 255));
      } else if (isPlaying) {
        // Organic pulse if playing
        const t = performance.now() * 0.003;
        bassEnergy = 0.25 + Math.sin(t) * 0.15 + Math.sin(t * 2.3) * 0.1;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Condensation Droplets on Glass
      droplets.forEach((drop) => {
        drop.wobble += 0.03;
        drop.y += drop.speed + bassEnergy * 0.4;
        if (drop.y > height + 20) {
          drop.y = -10;
          drop.x = Math.random() * width;
        }

        const wobbleX = Math.sin(drop.wobble) * (0.5 + bassEnergy * 1.5);
        const curRadius = drop.radius * (1 + bassEnergy * 0.25);

        // Glass refractive drop shadow & highlight
        ctx.save();
        ctx.beginPath();
        ctx.arc(drop.x + wobbleX, drop.y, curRadius, 0, Math.PI * 2);
        const dropGrad = ctx.createRadialGradient(
          drop.x + wobbleX - curRadius * 0.3,
          drop.y - curRadius * 0.3,
          curRadius * 0.1,
          drop.x + wobbleX,
          drop.y,
          curRadius
        );
        dropGrad.addColorStop(0, "rgba(255, 255, 255, 0.75)");
        dropGrad.addColorStop(0.6, "rgba(255, 255, 255, 0.25)");
        dropGrad.addColorStop(1, "rgba(100, 150, 255, 0.05)");

        ctx.fillStyle = dropGrad;
        ctx.fill();

        // Droplet rim
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Droplet specular highlight
        ctx.beginPath();
        ctx.arc(
          drop.x + wobbleX - curRadius * 0.35,
          drop.y - curRadius * 0.35,
          curRadius * 0.25,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.fill();
        ctx.restore();
      });

      // 2. Draw Dancing Luminous Dust Particles
      particles.forEach((p) => {
        p.x += p.speedX * (1 + bassEnergy);
        p.y += p.speedY * (1 + bassEnergy * 2);

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const pulseSize = p.size * (1 + bassEnergy * 0.6);
        const alpha = Math.min(1, p.baseOpacity * (0.8 + bassEnergy * 0.8));

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 75%, ${alpha})`;
        ctx.shadowBlur = 12 * (1 + bassEnergy);
        ctx.shadowColor = themeColor;
        ctx.fill();
        ctx.restore();
      });
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, [isPlaying, themeColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
