import { NextRequest, NextResponse } from "next/server";
import { SoundEngineServer } from "@/lib/sound-engine/server-engine";
import { sanitizeTrackId, isValidTrackId } from "@/lib/sound-engine/track-id";

export const dynamic = "force-dynamic";

const STREAM_HEADERS: Record<string, string> = {
  "Accept-Ranges": "bytes",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Type",
  "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
};

// Minimal silent MP3 frame buffer
const SILENT_MP3 = Buffer.from(
  "//uQZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA////////////////////////////////////////////////////////////////",
  "base64"
);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const idParam = searchParams.get("id");
  const directUrlParam = searchParams.get("url");
  const rangeHeader = request.headers.get("range") || undefined;

  let streamUrl = directUrlParam;

  if (!streamUrl && idParam) {
    const cleanId = sanitizeTrackId(idParam);
    if (isValidTrackId(cleanId)) {
      const track = await SoundEngineServer.getTrackById(cleanId);
      if (track?.streamUrl) {
        streamUrl = track.streamUrl;
      }
    }
  }

  if (!streamUrl) {
    return NextResponse.json(
      { code: "STREAM_NOT_FOUND", message: "Audio stream URL not found or track invalid." },
      { status: 404, headers: STREAM_HEADERS }
    );
  }

  try {
    const upstreamHeaders: Record<string, string> = {
      "User-Agent": "AuraicSoundEngine/1.0",
      Accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.8",
    };

    if (rangeHeader) {
      upstreamHeaders["Range"] = rangeHeader;
    }

    let response = await fetch(streamUrl, {
      headers: upstreamHeaders,
      redirect: "follow",
    });

    if (!response.ok && response.status !== 206 && idParam) {
      const cleanId = sanitizeTrackId(idParam);
      if (isValidTrackId(cleanId)) {
        try {
          const freshTrack = await SoundEngineServer.getTrackById(cleanId);
          if (freshTrack?.streamUrl && freshTrack.streamUrl !== streamUrl) {
            streamUrl = freshTrack.streamUrl;
            response = await fetch(streamUrl, {
              headers: upstreamHeaders,
              redirect: "follow",
            });
          }
        } catch {
          // ignore fallback error and proceed to error response below
        }
      }
    }

    if (!response.ok && response.status !== 206) {
      if (response.status === 404 || response.status === 410) {
        const silentHeaders = new Headers(STREAM_HEADERS);
        silentHeaders.set("Content-Type", "audio/mpeg");
        silentHeaders.set("Content-Length", String(SILENT_MP3.length));
        silentHeaders.set("X-Audio-Unavailable", "1");
        return new Response(SILENT_MP3, {
          status: 200,
          headers: silentHeaders,
        });
      }

      return NextResponse.json(
        { code: "UPSTREAM_STREAM_ERROR", message: `Upstream returned status ${response.status}` },
        { status: response.status >= 400 && response.status < 500 ? response.status : 502, headers: STREAM_HEADERS }
      );
    }

    const headers = new Headers(STREAM_HEADERS);
    headers.set("Content-Type", response.headers.get("content-type") || "audio/mpeg");

    const contentLength = response.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    const contentRange = response.headers.get("content-range");
    if (contentRange) headers.set("Content-Range", contentRange);

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("[SoundEngine Stream] Streaming failed:", error);
    return NextResponse.json(
      { code: "STREAM_UNAVAILABLE", message: "Audio stream is temporarily unavailable." },
      { status: 502, headers: STREAM_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { ...STREAM_HEADERS },
  });
}
