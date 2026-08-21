"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";

const DEFAULT_ACCENT = { solid: "#6366f1", soft: "rgba(99, 102, 241, 0.22)" };

const setTheme = (solid: string, soft: string) => {
  document.documentElement.style.setProperty("--auraic-accent", solid);
  document.documentElement.style.setProperty("--auraic-accent-soft", soft);
};

export default function DynamicTheme() {
  const image = usePlayerStore((state) => state.currentTrack?.image);

  useEffect(() => {
    if (!image) {
      setTheme(DEFAULT_ACCENT.solid, DEFAULT_ACCENT.soft);
      return;
    }

    let cancelled = false;
    const imageElement = new Image();
    imageElement.crossOrigin = "anonymous";
    imageElement.src = image;

    imageElement.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        const size = 24;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return;

        context.drawImage(imageElement, 0, 0, size, size);
        const pixels = context.getImageData(0, 0, size, size).data;
        let red = 0;
        let green = 0;
        let blue = 0;
        let count = 0;

        for (let index = 0; index < pixels.length; index += 16) {
          const brightness = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
          if (brightness < 20 || brightness > 245) continue;
          red += pixels[index];
          green += pixels[index + 1];
          blue += pixels[index + 2];
          count += 1;
        }

        if (!count) return;
        const accent = [red, green, blue].map((value) => Math.round(value / count));
        const solid = `rgb(${accent[0]}, ${accent[1]}, ${accent[2]})`;
        const soft = `rgba(${accent[0]}, ${accent[1]}, ${accent[2]}, 0.24)`;
        setTheme(solid, soft);
      } catch {
        setTheme(DEFAULT_ACCENT.solid, DEFAULT_ACCENT.soft);
      }
    };

    imageElement.onerror = () => setTheme(DEFAULT_ACCENT.solid, DEFAULT_ACCENT.soft);
    return () => {
      cancelled = true;
    };
  }, [image]);

  return null;
}
