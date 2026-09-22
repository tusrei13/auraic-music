import { NextRequest, NextResponse } from "next/server";
import { getSoundEngine } from "@/lib/sound-engine/server-engine";
import type { EngineAlbum, EngineArtist, EngineTrack } from "@/types/sound-engine";

export const dynamic = "force-dynamic";

export interface SearchResults {
  topResult?: { id: string; title: string; artist: string; type: "song" | "artist" | "album"; thumbnail: string };
  songs: EngineTrack[];
  artists: EngineArtist[];
  albums: EngineAlbum[];
}

type RawItem = Record<string, any>;

function thumbnail(item: RawItem): string {
  const thumbnails = Array.isArray(item.thumbnails) ? item.thumbnails : [];
  return thumbnails.at(-1)?.url || thumbnails[0]?.url || "";
}

function text(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((part) => text(part)).filter(Boolean).join(", ");
  if (value && typeof value === "object") return text((value as RawItem).text || (value as RawItem).name);
  return fallback;
}

function artistFor(item: RawItem, name: string): EngineArtist {
  const id = text(item.channel_id || item.artist_id || item.id, name);
  return {
    id,
    name: name || "Nghệ sĩ chưa rõ",
    handle: id,
    is_verified: false,
    profile_picture: thumbnail(item) ? { "480x480": thumbnail(item), "150x150": thumbnail(item) } : null,
  };
}

function durationInSeconds(value: unknown): number {
  const duration = text(value);
  const parts = duration.split(":").map(Number);
  if (parts.some(Number.isNaN)) return Number(value) || 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function parseSearchResults(raw: RawItem): SearchResults {
  const sections = [raw, ...(Array.isArray(raw.shelves) ? raw.shelves : []), ...(Array.isArray(raw.contents) ? raw.contents : [])];
  const songs: EngineTrack[] = [];
  const artists: EngineArtist[] = [];
  const albums: EngineAlbum[] = [];

  for (const section of sections) {
    const items = Array.isArray(section.items) ? section.items : Array.isArray(section.contents) ? section.contents : [];
    const sectionTitle = text(section.title || section.header).toLowerCase();
    for (const item of items as RawItem[]) {
      const kind = `${text(item.type)} ${text(item.item_type)} ${sectionTitle} ${item.constructor?.name || ""}`.toLowerCase();
      const title = text(item.title || item.name);
      const itemThumbnail = thumbnail(item);
      const subtitle = text(item.subtitle || item.artist || item.author);

      if (kind.includes("artist") || item.channel_id && !item.video_id && !item.playlist_id) {
        artists.push(artistFor(item, title));
      } else if (kind.includes("album") || item.playlist_id && (item.is_album || sectionTitle.includes("album"))) {
        const albumArtist = artistFor(item, subtitle);
        albums.push({
          id: text(item.playlist_id || item.id, title),
          playlist_name: title,
          is_album: true,
          track_count: Number(item.track_count || 0),
          artwork: itemThumbnail ? { "480x480": itemThumbnail, "150x150": itemThumbnail } : null,
          user: albumArtist,
        });
      } else if (item.video_id || kind.includes("song") || kind.includes("track")) {
        const songArtist = artistFor(item, subtitle);
        songs.push({
          id: text(item.video_id || item.id, title),
          title,
          duration: durationInSeconds(item.duration || item.length_text),
          artwork: itemThumbnail ? { "480x480": itemThumbnail, "150x150": itemThumbnail } : null,
          user: songArtist,
          is_streamable: true,
        });
      }
    }
  }

  const unique = <T extends { id: string }>(items: T[]) => [...new Map(items.map((item) => [item.id, item])).values()];
  const topResult: SearchResults["topResult"] = songs[0]
    ? {
        id: songs[0].id,
        title: songs[0].title,
        artist: songs[0].user.name,
        type: "song",
        thumbnail: songs[0].artwork?.["480x480"] || "",
      }
    : artists[0]
      ? {
          id: artists[0].id,
          title: artists[0].name,
          artist: artists[0].name,
          type: "artist",
          thumbnail: artists[0].profile_picture?.["480x480"] || "",
        }
      : albums[0]
        ? {
            id: albums[0].id,
            title: albums[0].playlist_name,
            artist: albums[0].user.name,
            type: "album",
            thumbnail: albums[0].artwork?.["480x480"] || "",
          }
        : undefined;

  return { topResult, songs: unique(songs), artists: unique(artists), albums: unique(albums) };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const filterType = request.nextUrl.searchParams.get("type") || "all";

  if (!query || !query.trim()) {
    return NextResponse.json({ error: "Missing search query" }, { status: 400 });
  }

  try {
    const engine = await getSoundEngine();
    const raw = await engine.music.search(query.trim(), { type: filterType as any });
    const data = parseSearchResults(raw as unknown as RawItem);

    return NextResponse.json(
      data,
      {
        headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" },
      }
    );
  } catch (err) {
    console.error("Search failed:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 502 });
  }
}
