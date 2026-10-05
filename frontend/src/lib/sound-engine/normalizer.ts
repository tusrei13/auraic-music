/**
 * Sound Engine - Track Data & Title Normalizer
 * Extracts cleanly separated artist and track titles from combined strings,
 * and strips common video/upload noise tags.
 */

import { EngineTrack, EngineArtist, EngineAlbum, EnginePlaylist } from "@/types/sound-engine";

const NOISE_TAGS = [
  /\[(?:Official\s*Audio|Official\s*Video|Official\s*Music\s*Video|MV|HD|4K|HQ|Lyric\s*Video)\]/gi,
  /\((?:Official\s*Audio|Official\s*Video|Official\s*Music\s*Video|MV|HD|4K|HQ|Lyric\s*Video|Audio)\)/gi,
  /\((?:Remastered|Bonus\s*Track|Explicit|Radio\s*Edit)\)/gi,
  /\[(?:Remastered|Bonus\s*Track|Explicit|Radio\s*Edit)\]/gi,
];

export interface TitleNormalizationResult {
  title: string;
  artistName: string;
}

/**
 * Normalizes a combined track title string (e.g., "Artist - Track")
 * into clean separated title and artistName properties.
 */
export function normalizeTrackTitle(
  rawTitle: string,
  fallbackArtist = "Unknown Artist"
): TitleNormalizationResult {
  if (!rawTitle || typeof rawTitle !== "string") {
    return { title: "Untitled Track", artistName: fallbackArtist };
  }

  let cleaned = rawTitle.trim();

  // Strip noise tags
  for (const regex of NOISE_TAGS) {
    cleaned = cleaned.replace(regex, " ").trim();
  }

  // Handle "Artist - Track Title" or "Artist — Track Title" or "Artist : Track Title"
  const delimiterMatch = cleaned.match(/^([^\-–—:|]+)\s*[\-–—:|]\s*(.+)$/);
  if (delimiterMatch) {
    const candidateArtist = delimiterMatch[1].trim();
    const candidateTitle = delimiterMatch[2].trim();
    if (candidateArtist && candidateTitle && !/^(track|song|vol|disc)\b/i.test(candidateArtist)) {
      return {
        artistName: candidateArtist,
        title: cleanUpWhitespace(candidateTitle),
      };
    }
  }

  // Handle "Track (feat. Artist)"
  const featMatch = cleaned.match(/^(.+?)\s*[\(\[]\s*(?:feat\.?|ft\.?)\s+([^\)\]]+)[\)\]](.*)$/i);
  if (featMatch) {
    const mainTitle = featMatch[1].trim();
    const featuredArtist = featMatch[2].trim();
    const suffix = featMatch[3]?.trim() || "";
    return {
      artistName: fallbackArtist !== "Unknown Artist" ? `${fallbackArtist} feat. ${featuredArtist}` : featuredArtist,
      title: cleanUpWhitespace(`${mainTitle} ${suffix}`),
    };
  }

  return {
    title: cleanUpWhitespace(cleaned) || "Untitled Track",
    artistName: fallbackArtist,
  };
}

function cleanUpWhitespace(str: string): string {
  return str.replace(/\s+/g, " ").trim();
}

export const UNPLAYABLE_TRACK_IDS = new Set<string>(["2034080"]);

export function isTrackStreamable(trackId: string | number): boolean {
  return !UNPLAYABLE_TRACK_IDS.has(String(trackId).replace(/^engine:/, ""));
}

/**
 * Normalizes raw REST API track data to unified EngineTrack format.
 */
export function normalizeRawTrack(raw: any): EngineTrack {
  const rawId = String(raw.id || Math.random().toString(36).slice(2)).replace(/^engine:/, "");
  const rawTitle = String(raw.name || raw.title || "Untitled Track");
  const rawArtist = String(raw.artist_name || raw.artist?.name || raw.user?.name || "Unknown Artist");

  const normalized = normalizeTrackTitle(rawTitle, rawArtist);
  const duration = Number(raw.duration) || 0;
  const image = raw.image || raw.album_image || raw.artworkUrl || "";
  const audio = raw.audio || raw.streamUrl || "";
  const genre = Array.isArray(raw.musicinfo?.tags?.genres) && raw.musicinfo.tags.genres.length > 0
    ? raw.musicinfo.tags.genres[0]
    : raw.genre || "Electronic";
  const license = raw.license_ccurl || raw.license || null;
  const albumName = raw.album_name || raw.album?.title || undefined;
  const albumId = raw.album_id ? String(raw.album_id) : raw.album?.id ? String(raw.album.id) : undefined;
  const releaseDate = raw.releasedate || raw.releaseDate || null;

  const artwork = image ? {
    "150x150": image,
    "480x480": image,
    "1000x1000": image,
  } : null;

  const artistUser: EngineArtist = {
    id: raw.artist_id ? String(raw.artist_id) : raw.artist?.id || rawId,
    name: normalized.artistName,
    handle: normalized.artistName.toLowerCase().replace(/\s+/g, ""),
    avatarUrl: image,
    profile_picture: artwork,
    is_verified: true,
  };

  return {
    id: rawId,
    title: normalized.title,
    artistName: normalized.artistName,
    artworkUrl: image,
    streamUrl: audio,
    duration,
    genre,
    license,
    albumName,
    albumId,
    releaseDate,
    bpm: raw.musicinfo?.speed ? parseInt(raw.musicinfo.speed, 10) : null,
    tags: Array.isArray(raw.musicinfo?.tags?.genres) ? raw.musicinfo.tags.genres.join(", ") : null,
    is_streamable: Boolean(audio) && !UNPLAYABLE_TRACK_IDS.has(rawId),
    play_count: Number(raw.stats?.rate_listened_total || raw.play_count || 0),
    favorite_count: Number(raw.stats?.favorited || raw.favorite_count || 0),
    artist: normalized.artistName,
    artwork,
    user: artistUser,
    streamSource: "engine",
  };
}

/**
 * Normalizes raw REST API artist data to unified EngineArtist format.
 */
export function normalizeRawArtist(raw: any): EngineArtist {
  const rawId = String(raw.id || Math.random().toString(36).slice(2)).replace(/^engine:/, "");
  const name = String(raw.name || "Unknown Artist");
  const image = raw.image || raw.avatar || raw.avatarUrl || "";

  const artwork = image ? {
    "150x150": image,
    "480x480": image,
    "1000x1000": image,
  } : null;

  return {
    id: rawId,
    name,
    handle: name.toLowerCase().replace(/\s+/g, ""),
    avatarUrl: image,
    profile_picture: artwork,
    is_verified: true,
    track_count: Number(raw.track_count || 0),
    album_count: Number(raw.album_count || 0),
  };
}

/**
 * Normalizes raw REST API album data to unified EngineAlbum format.
 */
export function normalizeRawAlbum(raw: any): EngineAlbum {
  const rawId = String(raw.id || Math.random().toString(36).slice(2)).replace(/^engine:/, "");
  const title = String(raw.name || raw.title || "Untitled Album");
  const artistName = String(raw.artist_name || raw.artist?.name || "Unknown Artist");
  const image = raw.image || raw.coverImage || raw.cover_image || "";
  const artistId = raw.artist_id ? String(raw.artist_id) : undefined;

  const artwork = image ? {
    "150x150": image,
    "480x480": image,
    "1000x1000": image,
  } : null;

  const artistUser: EngineArtist = {
    id: artistId || rawId,
    name: artistName,
    handle: artistName.toLowerCase().replace(/\s+/g, ""),
    avatarUrl: image,
    profile_picture: artwork,
    is_verified: true,
  };

  return {
    id: rawId,
    name: title,
    title,
    playlist_name: title,
    description: null,
    artworkUrl: image,
    artwork,
    user: artistUser,
    track_count: Number(raw.track_count || raw.tracks?.length || 0),
    is_album: true,
    artistId,
    artistName,
    releaseYear: raw.releasedate ? new Date(raw.releasedate).getFullYear() : undefined,
  };
}
