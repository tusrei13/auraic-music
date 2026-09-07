/**
 * HTML5 Canvas Dominant Color Extractor
 * Extracts vibrant and ambient glow colors from cover artwork
 */

export interface ExtractedColor {
  hex: string;
  rgb: [number, number, number];
  glow: string;
  subtleGlow: string;
  accent: string;
}

const DEFAULT_COLOR: ExtractedColor = {
  hex: "#8b5cf6",
  rgb: [139, 92, 246],
  glow: "rgba(139, 92, 246, 0.45)",
  subtleGlow: "rgba(139, 92, 246, 0.15)",
  accent: "#ec4899",
};

export async function extractDominantColor(imageUrl: string): Promise<ExtractedColor> {
  if (typeof window === "undefined" || !imageUrl) return DEFAULT_COLOR;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(DEFAULT_COLOR);
          return;
        }

        // Downsample to 40x40 for fast & smooth color averaging
        const size = 40;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let totalCount = 0;

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 128) continue; // Ignore transparent

          // Skip pure blacks or washed whites for more vibrant ambient glow
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          if (brightness > 20 && brightness < 240) {
            rSum += r;
            gSum += g;
            bSum += b;
            totalCount++;
          }
        }

        if (totalCount === 0) {
          resolve(DEFAULT_COLOR);
          return;
        }

        let rAvg = Math.round(rSum / totalCount);
        let gAvg = Math.round(gSum / totalCount);
        let bAvg = Math.round(bSum / totalCount);

        // Boost saturation slightly for luscious glass glow
        const max = Math.max(rAvg, gAvg, bAvg);
        if (max < 160) {
          rAvg = Math.min(255, Math.round(rAvg * 1.25));
          gAvg = Math.min(255, Math.round(gAvg * 1.25));
          bAvg = Math.min(255, Math.round(bAvg * 1.25));
        }

        const toHex = (n: number) => n.toString(16).padStart(2, "0");
        const hex = `#${toHex(rAvg)}${toHex(gAvg)}${toHex(bAvg)}`;
        const glow = `rgba(${rAvg}, ${gAvg}, ${bAvg}, 0.45)`;
        const subtleGlow = `rgba(${rAvg}, ${gAvg}, ${bAvg}, 0.18)`;
        const accent = `rgb(${Math.min(255, rAvg + 40)}, ${Math.max(0, gAvg - 20)}, ${Math.min(255, bAvg + 40)})`;

        resolve({
          hex,
          rgb: [rAvg, gAvg, bAvg],
          glow,
          subtleGlow,
          accent,
        });
      } catch {
        resolve(DEFAULT_COLOR);
      }
    };

    img.onerror = () => {
      resolve(DEFAULT_COLOR);
    };

    img.src = imageUrl;
  });
}
