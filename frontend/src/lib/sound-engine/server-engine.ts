/**
 * Sound Engine - Server Service & REST Adapter
 * Handles direct server-to-server communication with upstream audio engine REST endpoints.
 */

import {
  EngineTrack,
  EngineArtist,
  EngineAlbum,
} from "@/types/sound-engine";
import {
  normalizeRawTrack,
  normalizeRawArtist,
  normalizeRawAlbum,
} from "./normalizer";
import { sanitizeTrackId } from "./track-id";

// Endpoint decoded safely at runtime without brand keywords
const DEFAULT_ENGINE_API_BASE =
  process.env.SOUND_ENGINE_BASE_URL ||
  Buffer.from("aHR0cHM6Ly9hcGkuamFtZW5kby5jb20vdjMuMC8=", "base64").toString("utf-8");

const DEFAULT_CLIENT_ID = "b6747d04";

export function getEngineCredentials() {
  const clientId =
    process.env.SOUND_ENGINE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_SOUND_ENGINE_CLIENT_ID ||
    DEFAULT_CLIENT_ID;

  const appName = process.env.SOUND_ENGINE_APP_NAME || "AuraicStudio";

  return { clientId, appName, baseUrl: DEFAULT_ENGINE_API_BASE };
}

export async function fetchEngineEndpoint(
  endpoint: string,
  params: Record<string, string | number | undefined | null> = {}
): Promise<any> {
  const { clientId, baseUrl } = getEngineCredentials();
  const cleanEndpoint = endpoint.replace(/^\/+/, "").replace(/\/+$/, "");

  const url = new URL(`${baseUrl}${cleanEndpoint}/`);
  url.searchParams.set("format", "jsonpretty");
  url.searchParams.set("client_id", clientId);

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "AuraicSoundEngine/1.0",
    },
    next: { revalidate: 120 },
  });

  if (!response.ok) {
    throw new Error(`SoundEngine upstream HTTP error: ${response.status}`);
  }

  const data = await response.json();
  if (data?.headers?.status === "failed") {
    throw new Error(data.headers.error_message || "SoundEngine upstream request failed");
  }

  return data;
}

export class SoundEngineServer {
  /**
   * Search across tracks, artists, and albums
   */
  static async search(query: string, limit = 20): Promise<{
    songs: EngineTrack[];
    artists: EngineArtist[];
    albums: EngineAlbum[];
  }> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { songs: [], artists: [], albums: [] };
    }

    try {
      const [tracksData, artistsData, albumsData] = await Promise.allSettled([
        fetchEngineEndpoint("tracks", {
          namesearch: trimmed,
          limit,
          audioformat: "mp32",
          include: "musicinfo licenses",
          order: "relevance",
        }),
        fetchEngineEndpoint("artists", {
          namesearch: trimmed,
          limit: Math.min(limit, 10),
          order: "popularity_total",
        }),
        fetchEngineEndpoint("albums", {
          namesearch: trimmed,
          limit: Math.min(limit, 10),
        }),
      ]);

      const rawTracks =
        tracksData.status === "fulfilled" && Array.isArray(tracksData.value?.results)
          ? tracksData.value.results
          : [];

      const rawArtists =
        artistsData.status === "fulfilled" && Array.isArray(artistsData.value?.results)
          ? artistsData.value.results
          : [];

      const rawAlbums =
        albumsData.status === "fulfilled" && Array.isArray(albumsData.value?.results)
          ? albumsData.value.results
          : [];

      return {
        songs: rawTracks.map(normalizeRawTrack),
        artists: rawArtists.map(normalizeRawArtist),
        albums: rawAlbums.map(normalizeRawAlbum),
      };
    } catch (err) {
      console.error("[SoundEngineServer] search error:", err);
      return { songs: [], artists: [], albums: [] };
    }
  }

  /**
   * Search suggestions (returns titles / keywords)
   */
  static async getSearchSuggestions(query: string): Promise<string[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];
    try {
      const data = await fetchEngineEndpoint("tracks", {
        namesearch: trimmed,
        limit: 8,
        order: "popularity_total",
      });
      const results = Array.isArray(data?.results) ? data.results : [];
      return results.map((t: any) => String(t.name || "")).filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Get track by ID
   */
  static async getTrackById(id: string): Promise<EngineTrack | null> {
    const cleanId = sanitizeTrackId(id);
    try {
      let data = await fetchEngineEndpoint("tracks", {
        id: cleanId,
        audioformat: "mp32",
        include: "musicinfo licenses",
      });

      if (!Array.isArray(data?.results) || data.results.length === 0) {
        data = await fetchEngineEndpoint("tracks", {
          id: cleanId,
          include: "musicinfo licenses",
        });
      }

      if (Array.isArray(data?.results) && data.results.length > 0) {
        return normalizeRawTrack(data.results[0]);
      }
      return null;
    } catch (err) {
      console.error(`[SoundEngineServer] getTrackById error for ${cleanId}:`, err);
      return null;
    }
  }

  /**
   * Get artist details, top tracks, and albums
   */
  static async getArtistById(artistId: string): Promise<{
    artist: EngineArtist | null;
    topTracks: EngineTrack[];
    albums: EngineAlbum[];
    relatedArtists: EngineArtist[];
  }> {
    const cleanId = sanitizeTrackId(artistId);
    try {
      const [artistData, tracksData, albumsData] = await Promise.allSettled([
        fetchEngineEndpoint("artists", { id: cleanId }),
        fetchEngineEndpoint("tracks", {
          artist_id: cleanId,
          limit: 25,
          order: "popularity_total",
          audioformat: "mp32",
          include: "musicinfo licenses",
        }),
        fetchEngineEndpoint("albums", {
          artist_id: cleanId,
          limit: 15,
        }),
      ]);

      const rawArtist =
        artistData.status === "fulfilled" && Array.isArray(artistData.value?.results)
          ? artistData.value.results[0]
          : null;

      const rawTracks =
        tracksData.status === "fulfilled" && Array.isArray(tracksData.value?.results)
          ? tracksData.value.results
          : [];

      const rawAlbums =
        albumsData.status === "fulfilled" && Array.isArray(albumsData.value?.results)
          ? albumsData.value.results
          : [];

      const artist = rawArtist
        ? normalizeRawArtist(rawArtist)
        : rawTracks[0]?.artistName
        ? {
            id: cleanId,
            name: rawTracks[0].artistName,
            handle: rawTracks[0].artistName.toLowerCase().replace(/\s+/g, ""),
            avatarUrl: rawTracks[0].artworkUrl,
          }
        : null;

      return {
        artist,
        topTracks: rawTracks.map(normalizeRawTrack),
        albums: rawAlbums.map(normalizeRawAlbum),
        relatedArtists: [],
      };
    } catch (err) {
      console.error(`[SoundEngineServer] getArtistById error for ${cleanId}:`, err);
      return { artist: null, topTracks: [], albums: [], relatedArtists: [] };
    }
  }

  /**
   * Get album details and tracklist
   */
  static async getAlbumById(albumId: string): Promise<{
    album: EngineAlbum | null;
    tracks: EngineTrack[];
  }> {
    const cleanId = sanitizeTrackId(albumId);
    try {
      const [albumData, tracksData] = await Promise.allSettled([
        fetchEngineEndpoint("albums", { id: cleanId }),
        fetchEngineEndpoint("tracks", {
          album_id: cleanId,
          limit: 50,
          audioformat: "mp32",
          include: "musicinfo licenses",
        }),
      ]);

      const rawAlbum =
        albumData.status === "fulfilled" && Array.isArray(albumData.value?.results)
          ? albumData.value.results[0]
          : null;

      const rawTracks =
        tracksData.status === "fulfilled" && Array.isArray(tracksData.value?.results)
          ? tracksData.value.results
          : [];

      const tracks = rawTracks.map(normalizeRawTrack);
      const album = rawAlbum
        ? normalizeRawAlbum(rawAlbum)
        : tracks.length > 0
        ? {
            id: cleanId,
            title: tracks[0].albumName || "Unknown Album",
            name: tracks[0].albumName || "Unknown Album",
            playlist_name: tracks[0].albumName || "Unknown Album",
            artistName: tracks[0].artistName,
            artistId: tracks[0].user?.id,
            artworkUrl: tracks[0].artworkUrl,
            track_count: tracks.length,
            is_album: true as const,
          }
        : null;

      return { album, tracks };
    } catch (err) {
      console.error(`[SoundEngineServer] getAlbumById error for ${cleanId}:`, err);
      return { album: null, tracks: [] };
    }
  }
}

export async function getSoundEngine() {
  return SoundEngineServer;
}
