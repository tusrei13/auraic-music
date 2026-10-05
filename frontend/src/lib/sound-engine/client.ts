/**
 * Auraic Sound Engine - Client SDK & Audio Adapter
 * Standardized abstraction layer for audio catalog, streaming, and metadata.
 */

import {
  EngineTrack,
  EngineArtist,
  EnginePlaylist,
  EngineAlbum,
} from "@/types/sound-engine";
import { Track } from "@/store/usePlayerStore";
import { sanitizeTrackId, isValidTrackId } from "./track-id";
import {
  normalizeTrackTitle,
  normalizeRawTrack,
  normalizeRawArtist,
  normalizeRawAlbum,
  isTrackStreamable,
} from "./normalizer";

export const PROXY_BASE = "/api/sound-engine";

export { sanitizeTrackId, isValidTrackId, normalizeTrackTitle, isTrackStreamable };

export class AuraicAudioAdapter {
  static toPlayerTrack(engineTrack: EngineTrack): Track {
    const artwork =
      engineTrack.artworkUrl ||
      engineTrack.artwork?.["1000x1000"] ||
      engineTrack.artwork?.["480x480"] ||
      engineTrack.artwork?.["150x150"] ||
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop";

    const artistAvatar =
      engineTrack.user?.avatarUrl ||
      engineTrack.user?.profile_picture?.["480x480"] ||
      engineTrack.user?.profile_picture?.["150x150"] ||
      artwork;

    const cleanId = sanitizeTrackId(engineTrack.id);
    const artistName = engineTrack.artistName || engineTrack.artist || engineTrack.user?.name || "Unknown Artist";
    const streamUrl = engineTrack.streamUrl || `${PROXY_BASE}/stream?id=${encodeURIComponent(cleanId)}`;

    return {
      id: cleanId,
      title: engineTrack.title || "Untitled Track",
      artist: {
        id: engineTrack.user?.id || cleanId,
        name: artistName,
        avatar: artistAvatar,
      },
      image: artwork,
      audioUrl: streamUrl,
      duration: engineTrack.duration || 0,
      genre: engineTrack.genre || "Electronic",
      isEngineTrack: true,
      rawEngineTrack: engineTrack,
      streamSource: "engine",
    };
  }

  static isEngineTrackId(id: string | number): boolean {
    return String(id).startsWith("engine:") || isValidTrackId(id);
  }

  static extractRawId(id: string | number): string {
    return sanitizeTrackId(id);
  }
}

export class SoundEngineService {
  /**
   * Fetch trending tracks sorted by popularity
   */
  static async fetchTrendingTracks(
    limit = 20,
    genre?: string
  ): Promise<EngineTrack[]> {
    try {
      const params = new URLSearchParams({
        order: "popularity_week",
        limit: String(limit),
        audioformat: "mp32",
        include: "musicinfo licenses",
      });
      if (genre && genre !== "All" && genre !== "Tất cả") {
        params.set("tags", genre.toLowerCase());
      }

      const res = await fetch(`${PROXY_BASE}/tracks?${params.toString()}`);
      if (!res.ok) return [];
      const json = await res.json();
      const rawTracks = Array.isArray(json.results) ? json.results : Array.isArray(json) ? json : [];
      return rawTracks
        .map(normalizeRawTrack)
        .filter((t: EngineTrack) => Boolean(t.is_streamable && isTrackStreamable(t.id)));
    } catch (err) {
      console.warn("[SoundEngineService] fetchTrendingTracks failed:", err);
      return [];
    }
  }

  /**
   * Fetch featured/latest releases
   */
  static async fetchFeaturedTracks(limit = 15): Promise<EngineTrack[]> {
    try {
      const params = new URLSearchParams({
        order: "releasedate_desc",
        limit: String(limit),
        audioformat: "mp32",
        include: "musicinfo licenses",
      });

      const res = await fetch(`${PROXY_BASE}/tracks?${params.toString()}`);
      if (!res.ok) return [];
      const json = await res.json();
      const rawTracks = Array.isArray(json.results) ? json.results : Array.isArray(json) ? json : [];
      return rawTracks
        .map(normalizeRawTrack)
        .filter((t: EngineTrack) => Boolean(t.is_streamable && isTrackStreamable(t.id)));
    } catch (err) {
      console.warn("[SoundEngineService] fetchFeaturedTracks failed:", err);
      return [];
    }
  }

  /**
   * Fetch underground / indie tracks
   */
  static async fetchUndergroundTracks(limit = 15): Promise<EngineTrack[]> {
    return this.fetchTrendingTracks(limit, "indie");
  }

  /**
   * Fetch single track details by ID
   */
  static async fetchTrackDetails(trackId: string): Promise<EngineTrack | null> {
    try {
      const cleanId = sanitizeTrackId(trackId);
      if (!isValidTrackId(cleanId)) return null;

      const res = await fetch(`${PROXY_BASE}/track/${encodeURIComponent(cleanId)}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (json.track) return json.track;
      if (Array.isArray(json.results) && json.results[0]) {
        return normalizeRawTrack(json.results[0]);
      }
      return null;
    } catch (err) {
      console.warn(`[SoundEngineService] fetchTrackDetails failed for ${trackId}:`, err);
      return null;
    }
  }

  /**
   * Fetch artist profile, top tracks, and albums
   */
  static async fetchArtistProfile(artistId: string): Promise<{
    artist: EngineArtist | null;
    tracks: EngineTrack[];
    albums: EnginePlaylist[];
    relatedArtists: EngineArtist[];
  }> {
    try {
      const cleanId = sanitizeTrackId(artistId);
      const res = await fetch(`${PROXY_BASE}/artist/${encodeURIComponent(cleanId)}`);
      if (!res.ok) return { artist: null, tracks: [], albums: [], relatedArtists: [] };
      const json = await res.json();
      return {
        artist: json.artist || null,
        tracks: Array.isArray(json.tracks || json.topTracks) ? (json.tracks || json.topTracks) : [],
        albums: Array.isArray(json.albums) ? json.albums : [],
        relatedArtists: Array.isArray(json.relatedArtists) ? json.relatedArtists : [],
      };
    } catch (err) {
      console.warn(`[SoundEngineService] fetchArtistProfile failed for ${artistId}:`, err);
      return { artist: null, tracks: [], albums: [], relatedArtists: [] };
    }
  }

  /**
   * Fetch album details and tracklist
   */
  static async fetchAlbumDetails(albumId: string): Promise<{
    album: EngineAlbum | null;
    tracks: EngineTrack[];
  }> {
    try {
      const cleanId = sanitizeTrackId(albumId);
      const res = await fetch(`${PROXY_BASE}/album/${encodeURIComponent(cleanId)}`);
      if (!res.ok) return { album: null, tracks: [] };
      const json = await res.json();
      return {
        album: json.album || null,
        tracks: Array.isArray(json.tracks) ? json.tracks : [],
      };
    } catch (err) {
      console.warn(`[SoundEngineService] fetchAlbumDetails failed for ${albumId}:`, err);
      return { album: null, tracks: [] };
    }
  }

  /**
   * Search catalog for songs, artists, and albums
   */
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
      return Array.isArray(json.songs) ? json.songs : [];
    } catch (err) {
      console.warn(`[SoundEngineService] searchEngineCatalog failed for query "${query}":`, err);
      return [];
    }
  }

  /**
   * Fetch tracks by tag / genre
   */
  static async fetchTracksByTag(tag: string, limit = 24): Promise<EngineTrack[]> {
    return this.fetchTrendingTracks(limit, tag);
  }

  /**
   * Returns a direct streamable MP3 URL or stream proxy URL
   */
  static getStreamUrl(trackId: string, directUrl?: string): string {
    if (directUrl && directUrl.startsWith("http")) return directUrl;
    const cleanId = sanitizeTrackId(trackId);
    return `${PROXY_BASE}/stream?id=${encodeURIComponent(cleanId)}`;
  }
}

export class SoundEngineClient extends SoundEngineService {}
export const StreamEngineService = SoundEngineService;
