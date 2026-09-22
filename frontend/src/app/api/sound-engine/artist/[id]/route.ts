import { NextRequest, NextResponse } from "next/server";
import { getArtistProfile } from "@/lib/sound-engine/metadata";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const rawId = decodeURIComponent(id);
  const artistName = request.nextUrl.searchParams.get("name") || undefined;

  try {
    const { artist, topTracks, albums, singles, relatedArtists } = await getArtistProfile(rawId, artistName);

    return NextResponse.json(
      {
        artist,
        tracks: topTracks,
        topTracks,
        albums,
        singles,
        relatedArtists,
      },
      {
        headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
      }
    );
  } catch (err) {
    console.error(`[SoundEngine] Failed to fetch artist ${rawId}:`, err);
    return NextResponse.json({ error: "Artist not found" }, { status: 404 });
  }
}
