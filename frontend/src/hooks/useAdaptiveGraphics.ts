"use client";

import { useSyncExternalStore } from "react";

/**
 * Shared adaptive-graphics engine for the whole Auraic experience.
 *
 * A single global FPS monitor + hardware profiler drives every visual system
 * in the app (canvas particle count, 3D tilt, glassmorphism intensity).
 *
 * Rules:
 *  - `navigator.hardwareConcurrency < 4`  ->  "low" quality immediately.
 *  - `prefers-reduced-motion: reduce`     ->  "low" quality immediately.
 *  - Sustained FPS < 45 for ~0.5s         ->  auto-downgrade to "low".
 *  - Sustained FPS > 55 for ~3s on capable hardware -> restore to "high".
 */

export type GraphicsQuality = "high" | "low";

export interface AdaptiveGraphicsState {
  quality: GraphicsQuality;
  isLowSpec: boolean;
  reducedMotion: boolean;
  fps: number;
}

const INITIAL_STATE: AdaptiveGraphicsState = {
  quality: "high",
  isLowSpec: false,
  reducedMotion: false,
  fps: 60,
};

let state: AdaptiveGraphicsState = INITIAL_STATE;
const listeners = new Set<() => void>();

let listenerCount = 0;
let rafId: number | null = null;
let lastFrameTime = 0;
let lowFpsFrames = 0;
let highFpsFrames = 0;

const LOW_FPS_THRESHOLD = 45;
const HIGH_FPS_THRESHOLD = 55;
const LOW_FPS_SAMPLES = 30; // ~0.5s worth of frames
const HIGH_FPS_SAMPLES = 180; // ~3s worth of frames

function detectLowSpec(): boolean {
  if (typeof navigator === "undefined") return false;
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === "number" && cores > 0) return cores < 4;
  return false;
}

function detectReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function emit() {
  const next: AdaptiveGraphicsState = { ...state };
  state = next;
  for (const listener of listeners) listener();
}

function setQuality(quality: GraphicsQuality) {
  if (state.quality === quality) return;
  const wasLowSpec = state.isLowSpec;
  const wasReducedMotion = state.reducedMotion;
  state = { ...state, quality };
  // Persist the cheapest tier forever once the machine proves weak.
  if (quality === "low" && (wasLowSpec || wasReducedMotion)) {
    state = { ...state, isLowSpec: wasLowSpec, reducedMotion: wasReducedMotion };
  }
  emit();
}

function tick(now: number) {
  if (lastFrameTime !== 0) {
    const dt = now - lastFrameTime;
    if (dt > 0) {
      const instantFps = 1000 / dt;

      // Mutate fps in place (no new reference -> no re-render storm).
      state.fps = state.fps > 0 ? state.fps * 0.9 + instantFps * 0.1 : instantFps;

      if (state.quality === "high" && state.fps < LOW_FPS_THRESHOLD) {
        lowFpsFrames += 1;
        highFpsFrames = 0;
        if (lowFpsFrames >= LOW_FPS_SAMPLES) {
          lowFpsFrames = 0;
          setQuality("low");
        }
      } else if (state.quality === "low" && !state.isLowSpec && !state.reducedMotion && state.fps > HIGH_FPS_THRESHOLD) {
        highFpsFrames += 1;
        lowFpsFrames = 0;
        if (highFpsFrames >= HIGH_FPS_SAMPLES) {
          highFpsFrames = 0;
          setQuality("high");
        }
      } else {
        lowFpsFrames = 0;
        highFpsFrames = 0;
      }
    }
  }
  lastFrameTime = now;
  rafId = requestAnimationFrame(tick);
}

function ensureRunning() {
  if (listenerCount > 0 && rafId === null) {
    const isLowSpec = detectLowSpec();
    const reducedMotion = detectReducedMotion();
    state = {
      ...state,
      isLowSpec,
      reducedMotion,
      quality: isLowSpec || reducedMotion ? "low" : "high",
      fps: 60,
    };
    lowFpsFrames = 0;
    highFpsFrames = 0;
    lastFrameTime = 0;
    emit();
    rafId = requestAnimationFrame(tick);
  }
}

function ensureStopped() {
  if (listenerCount <= 0 && rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  listenerCount += 1;
  ensureRunning();
  return () => {
    listeners.delete(listener);
    listenerCount -= 1;
    ensureStopped();
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => INITIAL_STATE;

/**
 * Subscribe to the shared adaptive-graphics signal.
 * Re-renders the consumer ONLY when the quality tier actually flips.
 */
export function useAdaptiveGraphics(): AdaptiveGraphicsState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Non-reactive access for one-shot reads (e.g. in requestAnimationFrame loops
 * that already run outside of React's render cycle).
 */
export function getAdaptiveGraphics(): AdaptiveGraphicsState {
  return state;
}

/** Boolean shortcut: true when the adaptive engine has downgraded graphics. */
export function useLowPowerMode(): boolean {
  return useAdaptiveGraphics().quality === "low";
}