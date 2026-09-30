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

// ─── Noise filter ─────────────────────────────────────────────────────────────
const NOISE_WORDS = new Set([
  "song", "bài hát", "bai hat", "video", "official video", "music video", "mv",
  "album", "đĩa đơn", "single", "ep", "danh sách phát", "playlist", "podcast",
  "tập podcast", "views", "lượt xem", "lượt phát", "plays", "subscribers",
  "đăng ký", "bài hát •", "video •",
]);

function isNoise(str: string): boolean {
  if (!str) return true;
  const s = str.trim().toLowerCase();
  if (NOISE_WORDS.has(s)) return true;
  if (/^\d+(?::[0-5]\d)+$/.test(s)) return true;                                    // duration
  if (/^[\d,.]+\s*(?:tr|n|k|m|b|triệu|nghìn|tỷ)?\s*(?:lượt xem|lượt phát|views|plays|subscribers|đăng ký)?$/i.test(s)) return true;
  if (/^[12][0-9]{3}$/.test(s)) return true;                                        // year
  if (/(?:thg|tháng)\s*\d+/i.test(s)) return true;                                  // Vietnamese date
  return false;
}

// ─── Text helpers ─────────────────────────────────────────────────────────────
type RawItem = Record<string, any>;

/** Safely coerce an arbitrary value to a non-empty string. */
function text(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((p) => text(p)).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    const item = value as RawItem;
    if (typeof item.text === "string") return item.text;
    if (typeof item.name === "string") return item.name;
    if (Array.isArray(item.runs)) return item.runs.map((r: any) => r?.text || "").join("");
    if (typeof item.toString === "function" && item.toString !== Object.prototype.toString) {
      return item.toString();
    }
  }
  return fallback;
}

// ─── Artist extraction ────────────────────────────────────────────────────────
/**
 * Extract artist name from a MusicResponsiveListItem (or equivalent).
 *
 * YouTube Music search results always encode the artist in one of these places
 * (in priority order):
 *  1. `item.artists[]` — structured array added by youtubei.js
 *  2. `item.flex_columns[1].title.runs[0].text` — the first subtitle run
 *     (artists are always the first non-separator run in the subtitle column)
 *  3. `item.author / item.authors[]`
 *  4. Regex parse of "Artist – Title" title patterns
 *  5. Channel / uploader name
 */
function extractArtist(item: RawItem, rawTitle: string): string {
  // 1. Structured artists array (youtubei.js sets this on MusicResponsiveListItem)
  if (Array.isArray(item.artists) && item.artists.length > 0) {
    const names = item.artists
      .map((a: any) => {
        if (typeof a === "string") return a.trim();
        // artists[n].name is always a plain string in youtubei.js
        return typeof a?.name === "string" ? a.name.trim() : text(a?.name || a?.text).trim();
      })
      .filter((n: string) => n && !isNoise(n));
    if (names.length > 0) return names.join(", ");
  }

  // 2. flex_columns[1] subtitle runs — most reliable for YouTube Music results
  //    Structure: runs = [{text: "ArtistName", endpoint: browseEndpoint}, {text: " • "}, ...]
  if (Array.isArray(item.flex_columns) && item.flex_columns.length > 1) {
    const subtitleCol = item.flex_columns[1];
    const runs: any[] = subtitleCol?.title?.runs || [];
    for (const run of runs) {
      const t = (run?.text || "").trim();
      if (t && t !== "•" && t !== " • " && !isNoise(t)) {
        return t;
      }
    }
  }

  // 3. authors[] (Innertube Video results)
  if (Array.isArray(item.authors) && item.authors.length > 0) {
    const names = item.authors
      .map((a: any) => (typeof a === "string" ? a : text(a?.name || a?.text)).trim())
      .filter((n: string) => n && !isNoise(n));
    if (names.length > 0) return names.join(", ");
  }

  // 4. author / artist field
  const singleAuthor = item.author || item.artist;
  if (singleAuthor) {
    if (typeof singleAuthor === "string" && singleAuthor.trim() && !isNoise(singleAuthor)) {
      return singleAuthor.trim();
    }
    if (typeof singleAuthor === "object") {
      const name = text(singleAuthor.name || singleAuthor.text).trim();
      if (name && !isNoise(name)) return name;
    }
  }

  // 5. item.subtitle (string or {runs:[...]})
  if (item.subtitle && typeof item.subtitle === "object" && Array.isArray(item.subtitle.runs)) {
    for (const run of item.subtitle.runs) {
      const t = (run?.text || "").trim();
      if (t && t !== "•" && !isNoise(t)) return t;
    }
  }
  const subtitle = text(item.subtitle);
  if (subtitle.trim()) {
    const parts = subtitle.split(/[•·|]/).map((p) => p.trim()).filter((p) => !isNoise(p));
    if (parts.length > 0) return parts[0];
  }

  // 6. byline / short_byline
  const byline = text(item.byline || item.short_byline);
  if (byline.trim() && !isNoise(byline)) {
    const parts = byline.split(/[•·|]/).map((p) => p.trim()).filter((p) => !isNoise(p));
    if (parts.length > 0) return parts[0];
  }

  // 7. "Artist – Title" or "Song (feat. Artist)" patterns in title
  const fromTitle = extractArtistFromTitle(rawTitle);
  if (fromTitle.artist) return fromTitle.artist;

  // 8. Channel / uploader
  const uploader = text(item.uploader || item.channel || item.channel_title);
  if (uploader && !isNoise(uploader)) return uploader;

  return "Various Artists";
}

function extractArtistFromTitle(title: string): { artist: string; cleanTitle: string } {
  if (!title) return { artist: "", cleanTitle: title };
  const clean = title
    .replace(/\[(?:MV|Official\s*MV|Audio|Lyric\s*Video|HD|4K)\]/gi, "")
    .replace(/\((?:Official\s*Music\s*Video|Official\s*Video|Music\s*Video|Lyric\s*Video|Audio|4K|HD)\)/gi, "")
    .trim();

  // Song Name (feat. Artist)
  const featMatch = clean.match(/[\(\[]?\s*(?:feat\.?|ft\.?)\s+([^\)\]\-]+)[\)\]]?/i);
  if (featMatch?.[1]) {
    const a = featMatch[1].trim();
    if (a && !isNoise(a)) return { artist: a, cleanTitle: clean };
  }

  // Artist – Title
  const dashMatch = clean.match(/^([^-–—|:]+)\s*[-–—|:]\s*(.+)$/);
  if (dashMatch) {
    const candidateArtist = dashMatch[1].trim();
    const candidateSong = dashMatch[2].trim();
    if (candidateArtist && candidateSong && !isNoise(candidateArtist)) {
      return { artist: candidateArtist, cleanTitle: candidateSong };
    }
  }

  return { artist: "", cleanTitle: clean || title };
}

// ─── Thumbnail helpers ────────────────────────────────────────────────────────
function thumbnail(item: RawItem): string {
  const thumbnails = Array.isArray(item.thumbnails)
    ? item.thumbnails
    : Array.isArray(item.thumbnail?.contents)
    ? item.thumbnail.contents
    : Array.isArray(item.thumbnail)
    ? item.thumbnail
    : [];
  const found = thumbnails.at(-1)?.url || thumbnails[0]?.url || "";
  if (found) return found;
  const id = item.video_id || item.id;
  if (typeof id === "string" && id.length === 11) {
    return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  }
  return "";
}

function durationInSeconds(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "seconds" in (value as any)) {
    return Number((value as any).seconds) || 0;
  }
  const str = text(value);
  if (!str) return 0;
  const parts = str.split(":").map(Number);
  if (parts.some(Number.isNaN)) return Number(str) || 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function artistFor(item: RawItem, name: string): EngineArtist {
  const cleanName = name && name.trim() ? name.trim() : "Various Artists";
  const channelId = text(
    item.channel_id ||
      item.artist_id ||
      item.artists?.[0]?.channel_id ||
      item.authors?.[0]?.channel_id ||
      item.author?.channel_id ||
      item.id,
    cleanName
  );
  const pic = thumbnail(item);
  return {
    id: channelId,
    name: cleanName,
    handle: channelId.toLowerCase().replace(/\s+/g, ""),
    is_verified: false,
    profile_picture: pic ? { "480x480": pic, "150x150": pic } : null,
  };
}

// ─── Core parser ─────────────────────────────────────────────────────────────
/**
 * Parse the youtubei.js search result object into our SearchResults shape.
 *
 * The search result has the following shape:
 *   { contents: [MusicShelf | MusicCardShelf, ...] }
 *
 * MusicShelf.contents[] → MusicResponsiveListItem (songs / albums / artists)
 * MusicCardShelf        → top-result card
 */
function parseSearchResults(raw: RawItem): SearchResults {
  const songs: EngineTrack[] = [];
  const artists: EngineArtist[] = [];
  const albums: EngineAlbum[] = [];

  // Collect all section containers from the result
  const sections: RawItem[] = [
    raw,
    ...(Array.isArray(raw.shelves) ? raw.shelves : []),
    ...(Array.isArray(raw.contents) ? raw.contents : []),
  ];

  for (const section of sections) {
    if (!section) continue;

    // Top-result card (MusicCardShelf)
    const sectionConstructorName: string = section.constructor?.name || "";
    if (
      section.type === "MusicCardShelf" ||
      sectionConstructorName === "MusicCardShelf"
    ) {
      const cardTitle = text(section.title);
      const cardVideoId = text(
        section.title?.endpoint?.payload?.videoId ||
          section.endpoint?.payload?.videoId ||
          section.id
      );

      if (cardTitle && cardVideoId && cardVideoId.length === 11) {
        const cardArtist = extractArtist(section, cardTitle);
        const cardThumb = thumbnail(section);
        songs.push({
          id: cardVideoId,
          title: cardTitle,
          artist: cardArtist,
          duration: durationInSeconds(
            section.duration?.seconds || section.duration || section.subtitle
          ),
          artwork: cardThumb ? { "480x480": cardThumb, "150x150": cardThumb } : null,
          user: artistFor(section, cardArtist),
          is_streamable: true,
        });
      }
    }

    // Items from shelf — try both .contents and .items (youtubei.js uses .contents)
    const items: RawItem[] = Array.isArray(section.contents)
      ? section.contents
      : Array.isArray(section.items)
      ? section.items
      : [];

    const sectionTitle = text(section.title || section.header).toLowerCase();

    for (const item of items) {
      if (!item) continue;

      const rawTitle = text(item.title || item.name);
      if (!rawTitle) continue;

      const itemThumb = thumbnail(item);

      // Determine item type
      const itemType = `${text(item.type)} ${text(item.item_type)} ${sectionTitle} ${item.constructor?.name || ""}`.toLowerCase();
      const isArtistItem =
        itemType.includes("artist") ||
        (item.channel_id && !item.video_id && !item.id?.length === false && !item.playlist_id);
      const isAlbumItem =
        itemType.includes("album") ||
        (item.playlist_id &&
          (item.is_album ||
            sectionTitle.includes("album") ||
            String(item.playlist_id).startsWith("MPRE")));
      // video_id is undefined for YouTube Music items — use item.id only when it
      // is a real YouTube video ID. Never expose legacy/provider IDs as streams.
      const candidateVideoId = item.video_id || item.id;
      const videoId = /^[a-zA-Z0-9_-]{11}$/.test(String(candidateVideoId || ""))
        ? String(candidateVideoId)
        : null;
      const isSongOrVideo =
        videoId ||
        itemType.includes("song") ||
        itemType.includes("track") ||
        itemType.includes("video");

      if (isArtistItem) {
        artists.push(artistFor(item, rawTitle));
      } else if (isAlbumItem) {
        const albumArtistName = extractArtist(item, rawTitle);
        albums.push({
          id: text(item.playlist_id || item.id, rawTitle),
          playlist_name: rawTitle,
          is_album: true,
          track_count: Number(item.track_count || item.song_count || 0),
          artwork: itemThumb ? { "480x480": itemThumb, "150x150": itemThumb } : null,
          user: artistFor(item, albumArtistName),
        });
      } else if (isSongOrVideo) {
        const artistName = extractArtist(item, rawTitle);
        const { cleanTitle } = extractArtistFromTitle(rawTitle);
        const displayTitle = cleanTitle || rawTitle;
        const songId = text(videoId || item.id, displayTitle);

        songs.push({
          id: songId,
          streamSource: "youtube",
          title: displayTitle,
          artist: artistName,
          duration: durationInSeconds(item.duration?.seconds || item.duration || item.length_text),
          artwork: itemThumb ? { "480x480": itemThumb, "150x150": itemThumb } : null,
          user: artistFor(item, artistName),
          is_streamable: true,
        });
      }
    }
  }

  const unique = <T extends { id: string }>(items: T[]): T[] =>
    [...new Map(items.map((item) => [item.id, item])).values()];

  const uniqueSongs = unique(songs);
  const uniqueArtists = unique(artists);
  const uniqueAlbums = unique(albums);

  const topResult: SearchResults["topResult"] = uniqueSongs[0]
    ? {
        id: uniqueSongs[0].id,
        title: uniqueSongs[0].title,
        artist: uniqueSongs[0].artist || uniqueSongs[0].user.name || "Various Artists",
        type: "song",
        thumbnail: uniqueSongs[0].artwork?.["480x480"] || "",
      }
    : uniqueArtists[0]
    ? {
        id: uniqueArtists[0].id,
        title: uniqueArtists[0].name,
        artist: uniqueArtists[0].name,
        type: "artist",
        thumbnail: uniqueArtists[0].profile_picture?.["480x480"] || "",
      }
    : uniqueAlbums[0]
    ? {
        id: uniqueAlbums[0].id,
        title: uniqueAlbums[0].playlist_name,
        artist: uniqueAlbums[0].user.name || "Various Artists",
        type: "album",
        thumbnail: uniqueAlbums[0].artwork?.["480x480"] || "",
      }
    : undefined;

  return { topResult, songs: uniqueSongs, artists: uniqueArtists, albums: uniqueAlbums };
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const filterType = request.nextUrl.searchParams.get("type") || "all";

  if (!query || !query.trim()) {
    return NextResponse.json({ error: "Missing search query" }, { status: 400 });
  }

  try {
    const engine = await getSoundEngine();

    // Perform the search — the result is a live youtubei.js class instance.
    // We parse it BEFORE JSON serialization so getter-based properties are accessible.
    const raw = await engine.music.search(query.trim(), { type: filterType as any });
    const data = parseSearchResults(raw as unknown as RawItem);

    return NextResponse.json(data, {
      headers: { "Cache-Control": "s-maxage=120, stale-while-revalidate=300" },
    });
  } catch (err) {
    console.error("[SOUND_SEARCH] Search failed:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 502 });
  }
}
