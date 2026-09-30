export const YOUTUBE_TRACK_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function sanitizeStreamRequestTrackId(rawId: string): string {
  let cleanId = rawId.trim();

  for (let decodeCount = 0; decodeCount < 2; decodeCount += 1) {
    try {
      const decodedId = decodeURIComponent(cleanId.replace(/\+/g, " "));
      if (decodedId === cleanId) break;
      cleanId = decodedId;
    } catch {
      break;
    }
  }

  cleanId = cleanId
    .replace(/^(?:engine|youtube):/i, "")
    .split(/[?&#]/, 1)[0]
    .trim();

  if (
    cleanId.length === 12 &&
    cleanId.startsWith("-") &&
    YOUTUBE_TRACK_ID_PATTERN.test(cleanId.slice(1))
  ) {
    return cleanId.slice(1);
  }

  return cleanId;
}

export function sanitizeTrackId(
  id: string | number,
  source?: "youtube"
): string {
  if (source === "youtube") {
    return sanitizeStreamRequestTrackId(String(id));
  }

  return String(id)
    .replace(/^engine:/i, "")
    .replace(/^youtube:/i, "")
    .split(/[?&#]/, 1)[0]
    .trim();
}
