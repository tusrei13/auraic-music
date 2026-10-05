import { NextRequest, NextResponse } from "next/server";
import { SoundEngineServer } from "@/lib/sound-engine/server-engine";
import { sanitizeTrackId } from "@/lib/sound-engine/track-id";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rawId = decodeURIComponent(id);
  const cleanId = sanitizeTrackId(rawId);

  try {
    const { album, tracks } = await SoundEngineServer.getAlbumById(cleanId);

    if (!album && tracks.length === 0) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const title = album?.title || album?.name || "Unknown Album";
    const artistName = album?.artistName || tracks[0]?.artistName || "Unknown Artist";
    const artwork = album?.artwork || tracks[0]?.artwork || null;

    return NextResponse.json(
      {
        id: cleanId,
        title,
        artist: artistName,
        year: album?.releaseYear || (tracks[0]?.releaseDate ? new Date(tracks[0].releaseDate).getFullYear() : new Date().getFullYear()),
        trackCount: tracks.length,
        artwork,
        tracks,
        album,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error(`[SoundEngine] Failed to fetch album ${cleanId}:`, err);
    return NextResponse.json({ error: "Album not found" }, { status: 502 });
  }
}
