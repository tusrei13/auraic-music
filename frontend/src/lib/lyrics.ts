export interface LyricLine {
  time: number;
  text: string;
}

const timestampPattern = /\[(\d{1,3}):(\d{2})(?:[.:](\d{2,3}))?\]/g;

export const parseLrc = (source: string): LyricLine[] => {
  if (!source) return [];
  const lines: LyricLine[] = [];
  const rawLines = source.replace(/^\uFEFF/, "").split(/\r?\n/);

  for (const rawLine of rawLines) {
    const timestamps = [...rawLine.matchAll(timestampPattern)];
    if (timestamps.length === 0) continue;

    const text = rawLine.replace(timestampPattern, "").trim();
    if (!text) continue;

    for (const timestamp of timestamps) {
      const minutes = parseFloat(timestamp[1]);
      const seconds = parseFloat(timestamp[2]);
      const fraction = timestamp[3] ? parseFloat("0." + timestamp[3]) : 0;
      if (seconds >= 60) continue;
      lines.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }

  return lines.sort((first, second) => first.time - second.time);
};

/**
 * Intelligent Musical Stanza Pacing Algorithm:
 * Phân tích cấu trúc các khổ nhạc (Stanzas/Verses/Chorus) từ các khoảng cách dòng \n\n,
 * tính toán thời lượng hát tự nhiên theo nhịp điệu (Vocal Cadence Rate) và thời gian nghỉ giữa các đoạn.
 */
export const generateEstimatedPacedLyrics = (plainText: string, durationSeconds = 200): LyricLine[] => {
  const cleaned = plainText.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return [];

  // Tách thành các đoạn/khổ (Stanzas) dựa trên dấu cách dòng trống
  const stanzas = cleaned.split(/\n\s*\n/).map((s) =>
    s
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
  ).filter((s) => s.length > 0);

  if (stanzas.length === 0) return [];

  const allLines: Array<{ text: string; wordCount: number; isStanzaEnd: boolean }> = [];
  stanzas.forEach((stanza) => {
    stanza.forEach((line, idx) => {
      const wordCount = Math.max(line.split(/\s+/).length, 3);
      const isStanzaEnd = idx === stanza.length - 1;
      allLines.push({ text: line, wordCount, isStanzaEnd });
    });
  });

  if (allLines.length === 0) return [];

  const introMargin = 7.0; // Khoảng dạo đầu bài hát 7s
  const outroMargin = 10.0; // Khoảng dạo kết thúc 10s
  const usableDuration = Math.max(durationSeconds - introMargin - outroMargin, 30);

  const totalUnits = allLines.reduce((sum, item) => {
    return sum + item.wordCount + (item.isStanzaEnd ? 3.0 : 0.8);
  }, 0);

  const timePerUnit = usableDuration / totalUnits;
  let currentTimeCursor = introMargin;
  const result: LyricLine[] = [];

  for (let i = 0; i < allLines.length; i++) {
    const item = allLines[i];
    result.push({
      time: Math.round(currentTimeCursor * 100) / 100,
      text: item.text,
    });

    const lineDuration = item.wordCount * timePerUnit;
    const pauseDuration = (item.isStanzaEnd ? 3.0 : 0.8) * timePerUnit;
    currentTimeCursor += lineDuration + pauseDuration;
  }

  return result;
};

export const normalizeLyrics = (
  lyrics: string | LyricLine[] | null | undefined,
  fallbackDuration?: number
): LyricLine[] => {
  if (Array.isArray(lyrics)) {
    return lyrics
      .filter((line) => line && Number.isFinite(line.time) && typeof line.text === "string")
      .sort((first, second) => first.time - second.time);
  }

  if (typeof lyrics === "string" && lyrics.trim()) {
    const parsed = parseLrc(lyrics);
    if (parsed.length > 0) return parsed;
    // Nếu là plain text, phân tích cấu trúc khổ và nhịp điệu bài hát
    return generateEstimatedPacedLyrics(lyrics, fallbackDuration || 200);
  }

  return [];
};
