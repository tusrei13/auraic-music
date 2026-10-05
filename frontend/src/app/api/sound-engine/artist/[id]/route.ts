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
    const result = await SoundEngineServer.getArtistById(cleanId);

    if (!result || !result.artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        artist: result.artist,
        tracks: result.topTracks,
        topTracks: result.topTracks,
        albums: result.albums,
        singles: [],
        relatedArtists: result.relatedArtists,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error(`[SoundEngine] Failed to fetch artist ${cleanId}:`, err);
    return NextResponse.json({ error: "Artist not found" }, { status: 502 });
  }
}
