import { NextRequest, NextResponse } from "next/server";
import { getSoundEngine } from "@/lib/sound-engine/server-engine";

export const dynamic = "force-dynamic";

interface NormalizedTrack {
  id: string;
  title: string;
  description?: string | null;
  genre?: string | null;
  mood?: string | null;
  duration: number;
  play_count?: number;
  favorite_count?: number;
  repost_count?: number;
  artwork?: { "150x150"?: string; "480x480"?: string; "1000x1000"?: string } | null;
  user: { id: string; name: string; handle: string; profile_picture?: any; is_verified: boolean };
  remix_of?: any;
  stem_of?: any;
  bpm?: number | null;
  tags?: string | null;
  is_streamable: boolean;
  release_date?: string | null;
  downloadable?: boolean;
  license?: string | null;
}

function pickThumbnail(thumbnails: any[]): { "150x150"?: string; "480x480"?: string; "1000x1000"?: string } {
  if (!Array.isArray(thumbnails) || thumbnails.length === 0) return {};
  const url = thumbnails[0]?.url || "";
  const width = thumbnails[0]?.width || 0;
  if (width >= 1000) return { "1000x1000": url, "480x480": url, "150x150": url };
  if (width >= 480) return { "480x480": url, "150x150": url };
  return { "150x150": url };
}

function parseDuration(durationText: string): number {
  const parts = durationText.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseInt(durationText, 10) || 0;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rawId = decodeURIComponent(id);

  try {
    const engine = await getSoundEngine();
    const raw = await engine.music.getAlbum(rawId);
    const data = raw as any;

    const header = data.header || {};
    const thumbnails = Array.isArray(header.thumbnails) ? header.thumbnails : [];
    const artwork = pickThumbnail(thumbnails);
    const artistName = header.subtitle || "Unknown Artist";

    const tracks: NormalizedTrack[] = [];
    const shelves = Array.isArray(data.shelves) ? data.shelves : [];

    for (const shelf of shelves) {
      const title = (shelf.title || "").toLowerCase();
      if (title.includes("track") || title.includes("song")) {
        const items = Array.isArray(shelf.items) ? shelf.items : [];
        for (const item of items) {
          const itemThumbnails = Array.isArray(item.thumbnails) ? item.thumbnails : [];
          const itemArtwork = pickThumbnail(itemThumbnails);
          const duration = parseDuration(item.description || "0:0");

          tracks.push({
            id: item.video_id || item.id || Math.random().toString(36).slice(2),
            title: item.title || "Untitled",
            description: null,
            genre: null,
            mood: null,
            duration,
            play_count: 0,
            favorite_count: 0,
            repost_count: 0,
            artwork: itemArtwork || artwork,
            user: {
              id: rawId,
              name: artistName,
              handle: artistName.toLowerCase().replace(/\s+/g, ""),
              profile_picture: artwork,
              is_verified: !!header.badge,
            },
            remix_of: null,
            stem_of: null,
            bpm: null,
            tags: null,
            is_streamable: true,
            release_date: null,
            downloadable: false,
            license: null,
          });
        }
      }
    }

    const releaseYear = header.year || new Date().getFullYear();

    return NextResponse.json(
      {
        id: rawId,
        title: header.title || "Unknown Album",
        artist: artistName,
        year: releaseYear,
        trackCount: tracks.length,
        artwork,
        tracks,
      },
      {
        headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
      }
    );
  } catch (err) {
    console.error(`[SoundEngine] Failed to fetch album ${rawId}:`, err);
    return NextResponse.json({ error: "Album not found" }, { status: 404 });
  }
}
