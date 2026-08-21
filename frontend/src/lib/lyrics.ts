export interface LyricLine {
  time: number;
  text: string;
}

const timestampPattern = /\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

export const parseLrc = (source: string): LyricLine[] => {
  const lines: LyricLine[] = [];

  for (const rawLine of source.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const timestamps = [...rawLine.matchAll(timestampPattern)];
    if (timestamps.length === 0) continue;

    const text = rawLine.replace(timestampPattern, "").trim();
    if (!text) continue;

    for (const timestamp of timestamps) {
      const minutes = Number(timestamp[1]);
      const seconds = Number(timestamp[2]);
      const fraction = timestamp[3] ? Number(`0.${timestamp[3]}`) : 0;
      if (seconds >= 60) continue;
      lines.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }

  return lines.sort((first, second) => first.time - second.time);
};

export const normalizeLyrics = (lyrics: string | LyricLine[] | null | undefined): LyricLine[] => {
  if (typeof lyrics === "string") return parseLrc(lyrics);
  if (!Array.isArray(lyrics)) return [];

  return lyrics
    .filter((line) => line && Number.isFinite(line.time) && typeof line.text === "string")
    .sort((first, second) => first.time - second.time);
};
