/**
 * Sound Engine - Track ID Utilities
 * Provides sanitized ID normalization and validation.
 */

export const ENGINE_TRACK_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function sanitizeStreamRequestTrackId(rawId: string): string {
  let cleanId = String(rawId || "").trim();

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
    .replace(/^engine:/i, "")
    .split(/[?&#]/, 1)[0]
    .trim();

  return cleanId;
}

export function sanitizeTrackId(
  id: string | number,
  _source?: string
): string {
  return sanitizeStreamRequestTrackId(String(id));
}

export function isValidTrackId(id: string | number): boolean {
  const clean = sanitizeTrackId(id);
  return clean.length > 0 && ENGINE_TRACK_ID_PATTERN.test(clean);
}

export function isEngineTrackId(id: string | number): boolean {
  return String(id).startsWith("engine:") || isValidTrackId(id);
}
