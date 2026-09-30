/**
 * Auraic Sound Engine - Client SDK & Audio Adapter
 * High-level service client for communicating with the proxy backend,
 * providing typed data fetching and format conversions.
 */

import {
  EngineTrack,
  EngineArtist,
  EnginePlaylist,
} from "@/types/sound-engine";
import { Track } from "@/store/usePlayerStore";
import { sanitizeTrackId, YOUTUBE_TRACK_ID_PATTERN } from "./track-id";

export const PROXY_BASE = "/api/sound-engine";

export { sanitizeTrackId };
export { YOUTUBE_TRACK_ID_PATTERN };

export function isValidTrackId(id: string | number): boolean {
  return YOUTUBE_TRACK_ID_PATTERN.test(sanitizeTrackId(id));
}

function withYouTubeSource(track: EngineTrack): EngineTrack {
  return { ...track, streamSource: "youtube" };
}

export class AuraicAudioAdapter {
  static toPlayerTrack(engineTrack: EngineTrack): Track {
    const artwork =
      engineTrack.artwork?.["1000x1000"] ||
      engineTrack.artwork?.["480x480"] ||
      engineTrack.artwork?.["150x150"] ||
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop";

    const artistAvatar =
      engineTrack.user?.profile_picture?.["480x480"] ||
      engineTrack.user?.profile_picture?.["150x150"] ||
      artwork;

    const cleanId = sanitizeTrackId(engineTrack.id, "youtube");
    const streamUrl = isValidTrackId(cleanId)
      ? `${PROXY_BASE}/stream?id=${encodeURIComponent(cleanId)}&source=youtube`
      : "";

    const artistName =
      (typeof engineTrack.artist === "string" && engineTrack.artist.trim())
        ? engineTrack.artist.trim()
        : engineTrack.user?.name || engineTrack.user?.handle || "Unknown Artist";

    return {
      id: `youtube:${cleanId}`,
      title: engineTrack.title || "Untitled Track",
      artist: {
        id: engineTrack.user?.id || "",
        name: artistName,
        avatar: artistAvatar,
      },
      image: artwork,
      audioUrl: streamUrl,
      duration: engineTrack.duration || 0,
      genre: engineTrack.genre || "Electronic",
      streamSource: "youtube",
    };
  }

  static isYouTubeTrackId(id: string | number): boolean {
    return String(id).startsWith("youtube:");
  }

  static extractRawId(id: string | number): string {
    return sanitizeTrackId(id);
  }
}

export class StreamEngineService {
  static async fetchTrendingTracks(
    limit = 20,
    genre?: string
  ): Promise<EngineTrack[]> {
    const tag = genre && genre !== "All" && genre !== "Tất cả" ? `${genre} ` : "";
    return this.searchEngineCatalog(`${tag}trending songs`, limit);
  }

  static async fetchUndergroundTracks(limit = 15): Promise<EngineTrack[]> {
    return this.searchEngineCatalog("new indie music", limit);
  }

  static async fetchTrackDetails(trackId: string): Promise<EngineTrack | null> {
    try {
      const cleanId = sanitizeTrackId(trackId, "youtube");
      if (!isValidTrackId(cleanId)) return null;
      const res = await fetch(`${PROXY_BASE}/track/${encodeURIComponent(cleanId)}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.track ? withYouTubeSource(json.track) : null;
    } catch (err) {
      console.warn(`[StreamEngineService] Failed to fetch track ${trackId}:`, err);
      return null;
    }
  }

  static async fetchArtistProfile(artistId: string): Promise<{
    artist: EngineArtist | null;
    tracks: EngineTrack[];
    albums: EnginePlaylist[];
    relatedArtists: EngineArtist[];
  }> {
    try {
      const res = await fetch(`${PROXY_BASE}/artist/${encodeURIComponent(artistId)}`);
      if (!res.ok) return { artist: null, tracks: [], albums: [], relatedArtists: [] };
      const json = await res.json();
      return {
        artist: json.artist || null,
        tracks: Array.isArray(json.topTracks)
          ? json.topTracks.map((track: EngineTrack) => withYouTubeSource(track))
          : [],
        albums: Array.isArray(json.albums) ? json.albums : [],
        relatedArtists: Array.isArray(json.relatedArtists) ? json.relatedArtists : [],
      };
    } catch (err) {
      console.warn(`[StreamEngineService] Failed to fetch artist profile ${artistId}:`, err);
      return { artist: null, tracks: [], albums: [], relatedArtists: [] };
    }
  }

  static async searchEngineCatalog(query: string, limit = 20): Promise<EngineTrack[]> {
    if (!query || !query.trim()) return [];
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: String(limit),
      });
      const res = await fetch(`${PROXY_BASE}/search?${params.toString()}`);
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json.songs)
        ? json.songs.map((track: EngineTrack) => withYouTubeSource(track))
        : [];
    } catch (err) {
      console.warn(`[StreamEngineService] Search failed for query "${query}":`, err);
      return [];
    }
  }

  static async fetchTracksByTag(tag: string, limit = 24): Promise<EngineTrack[]> {
    return this.searchEngineCatalog(tag, limit);
  }

  static getStreamUrl(trackId: string): string {
    const paramId = sanitizeTrackId(trackId, "youtube");
    return `${PROXY_BASE}/stream?id=${encodeURIComponent(paramId)}&source=youtube`;
  }
}
