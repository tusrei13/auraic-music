import { NextRequest, NextResponse } from "next/server";
import { Innertube, Platform, UniversalCache, ClientType } from "youtubei.js";
import { getOptimalStreamHost, invalidateCurrentHost } from "@/lib/sound-engine/node-resolver";

export const dynamic = "force-dynamic";

const STREAM_HEADERS = {
  "Accept-Ranges": "bytes",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Type",
  "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
};

let youtubeEngine: Innertube | null = null;

Platform.shim.eval = async (data: { output: string }) => new Function(data.output)();

async function getYoutubeEngine(): Promise<Innertube> {
  if (!youtubeEngine) {
    youtubeEngine = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
      client_type: ClientType.MUSIC,
    });
  }
  return youtubeEngine;
}

async function streamFromYoutube(videoId: string, range?: string): Promise<Response> {
  const engine = await getYoutubeEngine();
  let info;
  try {
    info = await engine.getBasicInfo(videoId, { client: "YTMUSIC" });
  } catch (error) {
    console.warn(`[SOUND_STREAM_YTMUSIC_FAILED] ${videoId}:`, error);
    info = await engine.getBasicInfo(videoId, { client: "WEB" });
  }
  const format = info.chooseFormat({ type: "audio", quality: "best" });
  if (!format) throw new Error("No YouTube audio format available");

  const audioUrl = await format.decipher(engine.session.player);
  const requestedRange = range?.replace(/^bytes=/, "") || "0-1048575";
  const upstreamUrl = new URL(audioUrl);
  upstreamUrl.searchParams.set("cpn", info.cpn);
  upstreamUrl.searchParams.set("range", requestedRange);
  const response = await fetch(upstreamUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "*/*",
      Referer: "https://www.youtube.com/",
      Origin: "https://www.youtube.com",
      DNT: "?1",
    },
    redirect: "follow",
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`YouTube audio responded with ${response.status}`);

  const headers = new Headers(STREAM_HEADERS);
  headers.set("Content-Type", response.headers.get("content-type") || "audio/mp4");
  for (const name of ["content-length", "content-range", "cache-control", "etag"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  const [rangeStart, rangeEnd] = requestedRange.split("-").map(Number);
  const totalLength = Number(format.content_length) || 0;
  if (Number.isFinite(rangeStart) && Number.isFinite(rangeEnd) && totalLength > 0) {
    headers.set("Content-Range", `bytes ${rangeStart}-${rangeEnd}/${totalLength}`);
    headers.set("Accept-Ranges", "bytes");
  }
  return new Response(response.body, { status: 206, headers });
}

async function streamFromAudius(trackId: string, range?: string): Promise<Response> {
  const host = await getOptimalStreamHost();
  if (!host) throw new Error("No Audius stream host available");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`${host}/v1/tracks/${encodeURIComponent(trackId)}/stream`, {
      headers: {
        Accept: "audio/*,*/*",
        "User-Agent": "AuraicStudio-Web/1.0",
        ...(range ? { Range: range } : {}),
      },
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      invalidateCurrentHost(host);
      throw new Error(`Audius stream responded with ${response.status}`);
    }

    const headers = new Headers(STREAM_HEADERS);
    headers.set("Content-Type", response.headers.get("content-type") || "audio/mpeg");
    for (const name of ["content-length", "content-range", "cache-control", "etag"]) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }

    return new Response(response.body, { status: response.status, headers });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get("id");

  if (!trackId || trackId.length === 0) {
    return NextResponse.json(
      { error: "Invalid or missing track ID" },
      { status: 400 }
    );
  }

  try {
    if (trackId.length !== 11) {
      return await streamFromAudius(trackId, request.headers.get("range") || undefined);
    }

    return await streamFromYoutube(trackId, request.headers.get("range") || undefined);
  } catch (error: any) {
    console.error("[SOUND_STREAM_ERROR]:", error?.message || error);
    return NextResponse.json({ error: "Audio stream unavailable" }, { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...STREAM_HEADERS,
    },
  });
}
