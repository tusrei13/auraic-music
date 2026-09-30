import { getSoundEngine } from "./server-engine";

const NOISE_PATTERNS = /\(Official Music Video\)|\[MV\]|\bLYRIC VIDEO\b|\b4K\b|\bTopic\b|\(Official Video\)|\bOfficial Video\b|\bMusic Video\b|\[Official MV\]|\bHD\b/gi;

export function parseCleanTitle(rawTitle: string, artistName?: string): string {
  if (!rawTitle) return rawTitle;
  const artistPrefix = artistName
    ? new RegExp(`^${artistName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[-:|]\\s*`, "i")
    : null;
  const cleaned = rawTitle
    .replace(artistPrefix || /$^/, "")
    .replace(NOISE_PATTERNS, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.replace(/\s*[\(\)\[\]]\s*/g, "").trim() || rawTitle;
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

interface NormalizedArtist {
  id: string;
  name: string;
  handle: string;
  bio?: string | null;
  location?: string | null;
  profile_picture?: { "150x150"?: string; "480x480"?: string } | null;
  cover_photo?: { "640x"?: string; "2000x"?: string } | null;
  is_verified: boolean;
  follower_count?: number;
  followee_count?: number;
  track_count?: number;
  playlist_count?: number;
  album_count?: number;
}

interface NormalizedTrack {
  id: string;
  title: string;
  description?: string | null;
  genre?: string | null;
  mood?: string | null;
  duration: number;
  play_count?: number;
  favorite_count?: number;
  artwork?: { "150x150"?: string; "480x480"?: string; "1000x1000"?: string } | null;
  user: NormalizedArtist;
  bpm?: number | null;
  tags?: string | null;
  is_streamable: boolean;
  release_date?: string | null;
}

interface NormalizedPlaylist {
  id: string;
  playlist_name: string;
  description?: string | null;
  is_album: boolean;
  track_count: number;
  artwork?: { "150x150"?: string; "480x480"?: string; "1000x1000"?: string } | null;
  user: NormalizedArtist;
  total_play_count?: number;
  favorite_count?: number;
}

function pickThumbnail(thumbnails: any[]): { "150x150"?: string; "480x480"?: string; "1000x1000"?: string } {
  if (!Array.isArray(thumbnails) || thumbnails.length === 0) return {};
  const url = thumbnails[0]?.url || "";
  const width = thumbnails[0]?.width || 0;
  if (width >= 1000) return { "1000x1000": url, "480x480": url, "150x150": url };
  if (width >= 480) return { "480x480": url, "150x150": url };
  return { "150x150": url };
}

function normalizeArtist(raw: any, id: string): NormalizedArtist {
  const header = raw?.header || {};
  const thumbnails = Array.isArray(header.thumbnails) ? header.thumbnails : [];
  const banner = Array.isArray(header.banner) ? header.banner : [];
  const artwork = pickThumbnail(thumbnails);
  const coverPhoto: any = {};
  if (banner[0]?.url) {
    coverPhoto["640x"] = banner[0].url;
    coverPhoto["2000x"] = banner[0].url;
  }

  const subscriberText = header.subtitle || "";
  const followerCount = subscriberText ? parseInt(subscriberText.replace(/[^0-9]/g, ""), 10) || 0 : 0;

  return {
    id,
    name: header.title || id,
    handle: header.subtitle || id.toLowerCase().replace(/\s+/g, ""),
    bio: raw.description || null,
    location: null,
    profile_picture: artwork,
    cover_photo: coverPhoto,
    is_verified: !!header.badge,
    follower_count: followerCount,
    followee_count: 0,
    track_count: 0,
    playlist_count: 0,
    album_count: 0,
  };
}

function normalizeTrack(item: any, artist: NormalizedArtist): NormalizedTrack {
  const thumbnails = Array.isArray(item.thumbnails) ? item.thumbnails : [];
  const artwork = pickThumbnail(thumbnails);
  const durationText = item.description || "0:0";
  const durationParts = durationText.split(":").map(Number);
  const duration =
    durationParts.length === 2
      ? durationParts[0] * 60 + durationParts[1]
      : durationParts.length === 3
      ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
      : parseInt(durationText, 10) || 0;

  return {
    id: item.video_id || item.id || Math.random().toString(36).slice(2),
    title: item.title || "Untitled",
    description: null,
    genre: null,
    mood: null,
    duration,
    play_count: 0,
    favorite_count: 0,
    artwork,
    user: artist,
    bpm: null,
    tags: null,
    is_streamable: true,
    release_date: null,
  };
}

function normalizePlaylist(item: any, artist: NormalizedArtist, isAlbum = true): NormalizedPlaylist {
  const thumbnails = Array.isArray(item.thumbnails) ? item.thumbnails : [];
  const artwork = pickThumbnail(thumbnails);
  const trackCountText = item.description || "";
  const trackCount = parseInt(trackCountText.replace(/[^0-9]/g, ""), 10) || 0;

  return {
    id: item.playlist_id || item.id || Math.random().toString(36).slice(2),
    playlist_name: item.title || "Untitled Playlist",
    description: null,
    is_album: isAlbum,
    track_count: trackCount,
    artwork,
    user: artist,
    total_play_count: 0,
    favorite_count: 0,
  };
}

export async function getArtistProfile(artistId: string, artistName?: string) {
  const engine = await getSoundEngine();
  const raw = await engine.music.getArtist(artistId);
  const data = raw as any;

  const artist = normalizeArtist(data, artistId);
  const topTracks: NormalizedTrack[] = [];
  const albums: NormalizedPlaylist[] = [];
  const singles: NormalizedPlaylist[] = [];
  const relatedArtists: NormalizedArtist[] = [];

  const shelves = Array.isArray(data.shelves) ? data.shelves : [];
  for (const shelf of shelves) {
    const title = (shelf.title || "").toLowerCase();
    const items = Array.isArray(shelf.items) ? shelf.items : [];

    if (title.includes("song") || title.includes("track")) {
      for (const item of items) {
        topTracks.push(normalizeTrack(item, artist));
      }
    } else if (title.includes("album")) {
      for (const item of items) {
        albums.push(normalizePlaylist(item, artist, true));
      }
    } else if (title.includes("single")) {
      for (const item of items) {
        singles.push(normalizePlaylist(item, artist, false));
      }
    } else if (title.includes("related") || title.includes("artist")) {
      for (const item of items) {
        const relatedId = item.channel_id || item.id || item.video_id || Math.random().toString(36).slice(2);
        relatedArtists.push(normalizeArtist({ header: { title: item.title, thumbnails: item.thumbnails || [], subtitle: item.subtitle || "", badge: null } }, relatedId));
      }
    }
  }

  artist.track_count = topTracks.length;
  artist.album_count = albums.length + singles.length;

  const bio = await fetchLastFmBio(artistName || artist.name);
  if (bio) {
    artist.bio = bio;
  }

  return {
    artist,
    topTracks,
    albums,
    singles,
    relatedArtists,
  };
}
