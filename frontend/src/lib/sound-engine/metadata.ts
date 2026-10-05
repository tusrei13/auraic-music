import { SoundEngineServer } from "./server-engine";
import { normalizeTrackTitle } from "./normalizer";

export { normalizeTrackTitle };

export function parseCleanTitle(rawTitle: string, artistName?: string): string {
  const result = normalizeTrackTitle(rawTitle, artistName || "Unknown Artist");
  return result.title;
}

interface LastFmArtistInfo {
  bio?: {
    summary?: string;
    content?: string;
  } | null;
}

export async function fetchLastFmBio(artistName: string): Promise<string | null> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey || !artistName) return null;

  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${apiKey}&format=json`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { artist?: LastFmArtistInfo };
    const bio = json?.artist?.bio?.summary || json?.artist?.bio?.content || null;
    if (!bio) return null;
    return bio.replace(/<[^>]+>/g, "").trim() || null;
  } catch {
    return null;
  }
}

export async function getArtistProfile(artistId: string, artistName?: string) {
  const result = await SoundEngineServer.getArtistById(artistId);
  const artist = result.artist || {
    id: artistId,
    name: artistName || "Unknown Artist",
    handle: (artistName || artistId).toLowerCase().replace(/\s+/g, ""),
  };

  const bio = await fetchLastFmBio(artistName || artist.name);
  if (bio) {
    artist.bio = bio;
  }

  return {
    artist,
    topTracks: result.topTracks,
    albums: result.albums,
    singles: [],
    relatedArtists: result.relatedArtists,
  };
}
