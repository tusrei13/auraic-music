import { NextRequest, NextResponse } from "next/server";
import { SoundEngineServer } from "@/lib/sound-engine/server-engine";
import { sanitizeTrackId, isValidTrackId } from "@/lib/sound-engine/track-id";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const cleanId = sanitizeTrackId(id);

  if (!isValidTrackId(cleanId)) {
    return NextResponse.json({ error: "Invalid track ID" }, { status: 400 });
  }

  try {
    const track = await SoundEngineServer.getTrackById(cleanId);

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    return NextResponse.json(
      { track },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error(`[SoundEngine] Failed to fetch track ${cleanId}:`, error);
    return NextResponse.json({ error: "Failed to fetch track details" }, { status: 502 });
  }
}
