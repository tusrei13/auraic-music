import { NextResponse } from "next/server";
import { getSoundEngine } from "@/lib/sound-engine/server-engine";
import type { EngineTrack } from "@/types/sound-engine";
import { sanitizeStreamRequestTrackId, YOUTUBE_TRACK_ID_PATTERN } from "@/lib/sound-engine/track-id";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const videoId = sanitizeStreamRequestTrackId(id);

  if (!YOUTUBE_TRACK_ID_PATTERN.test(videoId)) {
    return NextResponse.json({ error: "Invalid YouTube video ID" }, { status: 400 });
  }

  try {
    const engine = await getSoundEngine();
    const info = await engine.getBasicInfo(videoId);
    const basicInfo = info.basic_info;

    if (!basicInfo.title) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const thumbnail = basicInfo.thumbnail?.at(-1)?.url;
    const artwork = thumbnail
      ? { "480x480": thumbnail, "150x150": thumbnail }
      : null;
    const artistName = basicInfo.author || basicInfo.channel?.name || "Unknown Artist";
    const artistId = basicInfo.channel_id || basicInfo.channel?.id || videoId;

    const track: EngineTrack = {
      id: videoId,
      streamSource: "youtube",
      title: basicInfo.title,
      artist: artistName,
      duration: basicInfo.duration || 0,
      artwork,
      user: {
        id: artistId,
        name: artistName,
        handle: artistName,
        is_verified: false,
        profile_picture: artwork,
      },
      is_streamable: true,
    };

    return NextResponse.json(
      { track },
      { headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error(`[YouTubeMusic] Failed to fetch track ${videoId}:`, error);
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }
}
