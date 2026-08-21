"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
}

export default function AudioVisualizer({ audioRef, isPlaying }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

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
    let source: MediaElementAudioSourceNode | null = null;
    let context: AudioContext | null = null;

    try {
      context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.82;
      source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);
      contextRef.current = context;
      analyserRef.current = analyser;

      const draw = () => {
        const currentCanvas = canvasRef.current;
        const currentAnalyser = analyserRef.current;
        if (!currentCanvas || !currentAnalyser) return;

        const rect = currentCanvas.getBoundingClientRect();
        const pixelRatio = window.devicePixelRatio || 1;
        const width = Math.max(1, Math.floor(rect.width * pixelRatio));
        const height = Math.max(1, Math.floor(rect.height * pixelRatio));
        if (currentCanvas.width !== width || currentCanvas.height !== height) {
          currentCanvas.width = width;
          currentCanvas.height = height;
        }

        const context2d = currentCanvas.getContext("2d");
        if (!context2d) return;
        context2d.clearRect(0, 0, width, height);

        const data = new Uint8Array(currentAnalyser.frequencyBinCount);
        currentAnalyser.getByteFrequencyData(data);
        const barWidth = width / data.length;
        const center = height / 2;

        data.forEach((value, index) => {
          const amplitude = (value / 255) * height * 0.8;
          const x = index * barWidth;
          const gradient = context2d.createLinearGradient(0, center - amplitude, 0, center + amplitude);
          gradient.addColorStop(0, "rgba(129, 140, 248, 0.08)");
          gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.7)");
          gradient.addColorStop(1, "rgba(129, 140, 248, 0.08)");
          context2d.fillStyle = gradient;
          context2d.fillRect(x, center - amplitude / 2, Math.max(1, barWidth - pixelRatio), amplitude);
        });

        animationFrame = window.requestAnimationFrame(draw);
      };

      draw();
    } catch {
      // Some remote audio hosts disallow Web Audio analysis through CORS.
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      source?.disconnect();
      analyserRef.current?.disconnect();
      if (context && context.state !== "closed") void context.close();
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
