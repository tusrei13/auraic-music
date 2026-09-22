"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const MAX_DPR = 1.5;

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
}

export default function AudioVisualizer({ audioRef, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const startLoopRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (isPlaying) startLoopRef.current?.();
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;

    try {
      const audioUrl = new URL(audio.currentSrc || audio.src, window.location.href);
      if (audioUrl.origin !== window.location.origin) return;
    } catch {
      return;
    }

    let running = false;
    let visible = false;
    let source: MediaElementAudioSourceNode | null = null;
    let context: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;

    const renderLoop = () => {
      if (!visible || !isPlayingRef.current) {
        running = false;
        gsap.ticker.remove(renderLoop);
        return;
      }
      const currentCanvas = canvasRef.current;
      if (!currentCanvas || !analyser) return;

      const rect = currentCanvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.max(1, Math.floor(rect.width * pixelRatio));
      const height = Math.max(1, Math.floor(rect.height * pixelRatio));
      if (currentCanvas.width !== width || currentCanvas.height !== height) {
        currentCanvas.width = width;
        currentCanvas.height = height;
      }

      const ctx = currentCanvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const barWidth = rect.width / data.length;
      const center = rect.height / 2;

      data.forEach((value, index) => {
        const amplitude = (value / 255) * rect.height * 0.8;
        const x = index * barWidth;
        const gradient = ctx.createLinearGradient(0, center - amplitude, 0, center + amplitude);
        gradient.addColorStop(0, "rgba(129, 140, 248, 0.08)");
        gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.7)");
        gradient.addColorStop(1, "rgba(129, 140, 248, 0.08)");
        ctx.fillStyle = gradient;
        ctx.fillRect(x, center - amplitude / 2, Math.max(1, barWidth - pixelRatio), amplitude);
      });

      running = true;
    };

    const startLoop = () => {
      if (running || !visible) return;
      gsap.ticker.add(renderLoop);
    };
    startLoopRef.current = startLoop;

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting !== false;
        if (visible) startLoop();
        else if (!visible) {
          gsap.ticker.remove(renderLoop);
          running = false;
        }
      },
      { rootMargin: "50px" }
    );
    observer.observe(canvas);

    try {
      context = new AudioContext();
      analyser = context.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.82;
      source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);
      contextRef.current = context;
      analyserRef.current = analyser;
      if (typeof window !== "undefined") {
        (window as unknown as { __auraic_analyser__?: AnalyserNode | null }).__auraic_analyser__ = analyser;
      }
    } catch {
      analyser = null;
    }

    return () => {
      mountedRef.current = false;
      observer.disconnect();
      gsap.ticker.remove(renderLoop);
      running = false;
      startLoopRef.current = null;
      source?.disconnect();
      analyserRef.current?.disconnect();
      if (typeof window !== "undefined" && (window as unknown as { __auraic_analyser__?: AnalyserNode | null }).__auraic_analyser__ === analyser) {
        (window as unknown as { __auraic_analyser__?: AnalyserNode | null }).__auraic_analyser__ = null;
      }
      analyserRef.current = null;
      contextRef.current = null;
    };
  }, [audioRef]);

  useEffect(() => {
    if (isPlaying && contextRef.current?.state === "suspended" && mountedRef.current) {
      void contextRef.current.resume();
    }
  }, [isPlaying]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />;
}
