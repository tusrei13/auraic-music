"use client";

import { useEffect, useRef } from "react";

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

    let animationFrame = 0;
    let running = false;
    let visible = false;
    let source: MediaElementAudioSourceNode | null = null;
    let context: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;

    const renderLoop = () => {
      if (!visible || !isPlayingRef.current) {
        running = false;
        return;
      }
      const currentCanvas = canvasRef.current;
      if (!currentCanvas || !analyser) return;

      const rect = currentCanvas.getBoundingClientRect();
      // Resolution capping keeps the tiny equalizer cheap on Retina/4K.
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.max(1, Math.floor(rect.width * pixelRatio));
      const height = Math.max(1, Math.floor(rect.height * pixelRatio));
      if (currentCanvas.width !== width || currentCanvas.height !== height) {
        currentCanvas.width = width;
        currentCanvas.height = height;
      }

      const context2d = currentCanvas.getContext("2d");
      if (!context2d) return;
      context2d.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context2d.clearRect(0, 0, rect.width, rect.height);

      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const barWidth = rect.width / data.length;
      const center = rect.height / 2;

      data.forEach((value, index) => {
        const amplitude = (value / 255) * rect.height * 0.8;
        const x = index * barWidth;
        const gradient = context2d.createLinearGradient(0, center - amplitude, 0, center + amplitude);
        gradient.addColorStop(0, "rgba(129, 140, 248, 0.08)");
        gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.7)");
        gradient.addColorStop(1, "rgba(129, 140, 248, 0.08)");
        context2d.fillStyle = gradient;
        context2d.fillRect(x, center - amplitude / 2, Math.max(1, barWidth - pixelRatio), amplitude);
      });

      running = true;
      animationFrame = window.requestAnimationFrame(renderLoop);
    };

    const startLoop = () => {
      if (running || !visible) return;
      animationFrame = window.requestAnimationFrame(renderLoop);
    };
    startLoopRef.current = startLoop;

    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting !== false;
        if (visible) startLoop();
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
      observer.disconnect();
      window.cancelAnimationFrame(animationFrame);
      running = false;
      startLoopRef.current = null;
      source?.disconnect();
      analyserRef.current?.disconnect();
      if (context && context.state !== "closed") void context.close();
      if (typeof window !== "undefined" && (window as unknown as { __auraic_analyser__?: AnalyserNode | null }).__auraic_analyser__ === analyser) {
        (window as unknown as { __auraic_analyser__?: AnalyserNode | null }).__auraic_analyser__ = null;
      }
      analyserRef.current = null;
      contextRef.current = null;
    };
  }, [audioRef]);

  useEffect(() => {
    if (isPlaying && contextRef.current?.state === "suspended") {
      void contextRef.current.resume();
    }
  }, [isPlaying]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-70" />;
}