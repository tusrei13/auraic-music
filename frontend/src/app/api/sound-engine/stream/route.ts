import { NextRequest, NextResponse } from "next/server";
import { Innertube, Platform, UniversalCache } from "youtubei.js";
import { sanitizeStreamRequestTrackId } from "@/lib/sound-engine/track-id";

export const dynamic = "force-dynamic";

// ─── Platform JS evaluator shim ────────────────────────────────────────────
// MUST be set before any Innertube.create() call so the player script can run.
Platform.shim.eval = async (data: { output: string }) => {
  return new Function(data.output)();
};

const STREAM_HEADERS: Record<string, string> = {
  "Accept-Ranges": "bytes",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Type",
  "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
};

const YOUTUBE_TRACK_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const MAX_UPSTREAM_RANGE_BYTES = 1024 * 1024;
const YOUTUBE_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

type StreamErrorCode =
  | "INVALID_TRACK_ID"
  | "INVALID_RANGE"
  | "VIDEO_UNAVAILABLE"
  | "STREAM_UNAVAILABLE";

type StreamErrorStatus = 400 | 404 | 410 | 416 | 502;

class StreamRouteError extends Error {
  constructor(
    readonly code: StreamErrorCode,
    readonly status: StreamErrorStatus,
    message: string
  ) {
    super(message);
    this.name = "StreamRouteError";
  }
}

function streamErrorResponse(error: StreamRouteError) {
  return NextResponse.json(
    { code: error.code, message: error.message },
    { status: error.status, headers: STREAM_HEADERS }
  );
}

function isUnavailableMessage(message: string): boolean {
  return /\b(video|content)\b.{0,80}\b(unavailable|not\s+available|not\s+found|private|removed)\b/i.test(
    message
  );
}

async function getUnavailableStatus(
  response: Response
): Promise<404 | 410 | null> {
  if (response.status === 410) return 410;
  if (response.status !== 404) return null;

  let body: string;
  try {
    body = await response.clone().text();
  } catch {
    return null;
  }

  return isUnavailableMessage(body) ? 404 : null;
}

// ─── In-memory caches ───────────────────────────────────────────────────────
// `getBasicInfo` is expensive and rate-limited by YouTube. Cache the resolved
// stream URL per video so repeated range requests do not hammer YouTube.
interface CachedStream {
  url: string;
  mimeType: string;
  totalLength: number;
  expiresAt: number;
}

interface ByteRange {
  start: number;
  end: number;
}

const streamCache = new Map<string, CachedStream>();
const basicInfoCache = new Map<string, { value: any; expiresAt: number }>();
const BASIC_INFO_CACHE_TTL_MS = 60_000; // 1 min
const STREAM_URL_CACHE_TTL_MS = 5 * 60_000; // 5 min

function getCachedStream(videoId: string): CachedStream | undefined {
  const cached = streamCache.get(videoId);
  if (!cached) return undefined;
  if (Date.now() > cached.expiresAt) {
    streamCache.delete(videoId);
    return undefined;
  }
  return cached;
}

function setCachedStream(videoId: string, value: CachedStream) {
  streamCache.set(videoId, value);
}

function getCachedBasicInfo(key: string): any | undefined {
  const cached = basicInfoCache.get(key);
  if (!cached) return undefined;
  if (Date.now() > cached.expiresAt) {
    basicInfoCache.delete(key);
    return undefined;
  }
  return cached.value;
}

function setCachedBasicInfo(key: string, value: any) {
  basicInfoCache.set(key, {
    value,
    expiresAt: Date.now() + BASIC_INFO_CACHE_TTL_MS,
  });
}

function getTotalLength(response: Response): number {
  const contentRange = response.headers.get("content-range");
  const match = contentRange?.match(/^bytes \d+-\d+\/(\d+)$/i);
  return match ? Number(match[1]) : 0;
}

function resolveByteRange(
  rangeHeader: string | undefined,
  totalLength: number
): ByteRange | null {
  if (!rangeHeader) return { start: 0, end: totalLength - 1 };

  const match = rangeHeader.trim().match(/^bytes=(\d*)-(\d*)$/i);
  if (!match || (!match[1] && !match[2])) return null;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    return {
      start: Math.max(0, totalLength - suffixLength),
      end: totalLength - 1,
    };
  }

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : totalLength - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(requestedEnd) ||
    start < 0 ||
    requestedEnd < start ||
    start >= totalLength
  ) {
    return null;
  }

  return { start, end: Math.min(requestedEnd, totalLength - 1) };
}

function fetchYoutubeRange(
  url: string,
  start: number,
  end: number
): Promise<Response> {
  return fetch(url, {
    headers: {
      "User-Agent": YOUTUBE_USER_AGENT,
      Accept: "*/*",
      Range: `bytes=${start}-${end}`,
    },
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
}

function createChunkedYoutubeBody(
  url: string,
  firstResponse: Response,
  firstEnd: number,
  requestedEnd: number
): ReadableStream<Uint8Array> {
  let reader = firstResponse.body?.getReader() ?? null;
  let nextByte = firstEnd + 1;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        while (true) {
          if (reader) {
            const { done, value } = await reader.read();
            if (!done) {
              controller.enqueue(value);
              return;
            }
            reader.releaseLock();
            reader = null;
          }

          if (nextByte > requestedEnd) {
            controller.close();
            return;
          }

          const chunkEnd = Math.min(
            nextByte + MAX_UPSTREAM_RANGE_BYTES - 1,
            requestedEnd
          );
          const response = await fetchYoutubeRange(url, nextByte, chunkEnd);
          if (response.status !== 206 || !response.body) {
            console.warn("[sound-stream]", {
              stage: "youtube-range-chunk",
              status: response.status,
            });
            throw new Error(`YouTube range request failed with ${response.status}`);
          }

          reader = response.body.getReader();
          nextByte = chunkEnd + 1;
        }
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel(reason) {
      if (reader) await reader.cancel(reason);
    },
  });
}

// ─── Resolve a stream URL from a format ────────────────────────────────────
// Some clients (IOS, TV) return a pre-signed `url` property that doesn't need
// deciphering. For clients that do require deciphering (WEB), we call
// fmt.decipher() which runs the player JS via Platform.shim.eval.
async function resolveFormatUrl(fmt: any, player: any): Promise<string | null> {
  if (typeof fmt.url === "string" && fmt.url.startsWith("http")) return fmt.url;

  try {
    const url = await fmt.decipher(player);
    if (typeof url === "string" && url.startsWith("http")) return url;
  } catch {
    console.warn("[sound-stream]", { stage: "decipher", outcome: "failed" });
  }
  return null;
}

// ─── Primary: YouTube via Innertube ─────────────────────────────────────────
async function resolveStreamUrl(
  engine: Innertube,
  videoId: string
): Promise<{ url: string; mimeType: string; totalLength: number } | null> {
  const clientsToTry = ["ANDROID", "WEB", "TVHTML5", "IOS", "YTMUSIC"] as const;
  let unavailableError: StreamRouteError | null = null;

  for (const client of clientsToTry) {
    try {
      const cacheKey = `${videoId}:${client}`;
      let info: any = getCachedBasicInfo(cacheKey);

      if (!info) {
        info = await Promise.race([
          engine.getBasicInfo(videoId, { client: client as any }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("getBasicInfo timeout")), 8000)),
        ]).catch((e: any) => { throw e; });
        setCachedBasicInfo(cacheKey, info);
      }

      const fmt = info.chooseFormat?.({ type: "audio", quality: "best" }) || info.audioFormats?.slice().sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))?.[0];
      if (!fmt) {
        console.warn("[sound-stream]", {
          stage: "format-selection",
          client,
          outcome: "no-audio-format",
        });
        continue;
      }

      const url = await resolveFormatUrl(fmt, engine.session.player);
      if (!url) {
        console.warn("[sound-stream]", {
          stage: "format-resolution",
          client,
          outcome: "no-playable-url",
        });
        continue;
      }

      const audioUrl = url.startsWith("http") ? url : new URL(url, "https://www.youtube.com").toString();
      const mimeType = (fmt.mime_type || "audio/mp4").split(";")[0].trim();
      const totalLength = Number(fmt.content_length) || 0;

      const result = { url: audioUrl, mimeType, totalLength };
      // A signed URL is reusable for subsequent browser range requests. Cache
      // it independently of the client that produced the format so seeking
      // does not repeatedly run format selection or deciphering.
      setCachedStream(videoId, {
        url: audioUrl,
        mimeType,
        totalLength,
        expiresAt: Date.now() + STREAM_URL_CACHE_TTL_MS,
      });
      console.info("[sound-stream]", {
        stage: "format-selection",
        client,
        mimeType,
      });
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      if (isUnavailableMessage(message)) {
        unavailableError = new StreamRouteError(
          "VIDEO_UNAVAILABLE",
          404,
          "This video is unavailable or cannot be played."
        );
      }
      console.warn("[sound-stream]", {
        stage: "youtube-client",
        client,
        outcome: "failed",
        unavailable: isUnavailableMessage(message),
      });
    }
  }

  if (unavailableError) throw unavailableError;
  return null;
}

async function streamFromYoutube(
  videoId: string,
  rangeHeader?: string,
  refreshCachedUrl = true
): Promise<Response> {
  const engine = await getYoutubeEngine();
  const cached = getCachedStream(videoId);
  let stream = cached
    ? { url: cached.url, mimeType: cached.mimeType, totalLength: cached.totalLength }
    : null;

  if (!stream) {
    stream = await resolveStreamUrl(engine, videoId);
  }
  if (!stream) throw new Error(`YouTube stream unavailable for ${videoId}`);

  let totalLength = stream.totalLength;
  if (totalLength <= 0) {
    const probe = await fetchYoutubeRange(stream.url, 0, 0);
    if (!probe.ok) {
      await probe.body?.cancel();
      if (probe.status === 404 || probe.status === 410) {
        throw new StreamRouteError(
          "VIDEO_UNAVAILABLE",
          probe.status,
          "This video is unavailable or cannot be played."
        );
      }
      throw new Error(`YouTube range probe failed with ${probe.status}`);
    }
    totalLength = getTotalLength(probe);
    await probe.body?.cancel();
  }

  if (totalLength <= 0) {
    throw new Error("YouTube did not provide a valid stream length");
  }

  const byteRange = resolveByteRange(rangeHeader, totalLength);
  if (!byteRange) {
    return streamErrorResponse(
      new StreamRouteError(
        "INVALID_RANGE",
        416,
        "Requested byte range is invalid or unsatisfiable."
      )
    );
  }

  const firstEnd = Math.min(
    byteRange.end,
    byteRange.start + MAX_UPSTREAM_RANGE_BYTES - 1
  );
  const response = await fetchYoutubeRange(
    stream.url,
    byteRange.start,
    firstEnd
  );

  if (!response.ok) {
    console.warn("[sound-stream]", {
      stage: "youtube-upstream",
      status: response.status,
    });

    if (response.status === 404 || response.status === 410) {
      throw new StreamRouteError(
        "VIDEO_UNAVAILABLE",
        response.status,
        "This video is unavailable or cannot be played."
      );
    }

    if (cached) {
      streamCache.delete(videoId);
      for (const client of ["IOS", "WEB", "YTMUSIC", "ANDROID", "TVHTML5"]) {
        basicInfoCache.delete(`${videoId}:${client}`);
      }
      if (refreshCachedUrl) {
        return streamFromYoutube(videoId, rangeHeader, false);
      }
    }

    throw new Error(`YouTube upstream responded with ${response.status} for ${videoId}`);
  }

  const upstreamTotalLength = getTotalLength(response);
  if (upstreamTotalLength > 0) {
    totalLength = upstreamTotalLength;
    setCachedStream(videoId, {
      url: stream.url,
      mimeType: stream.mimeType,
      totalLength,
      expiresAt: Date.now() + STREAM_URL_CACHE_TTL_MS,
    });
  }

  if (response.status === 200) {
    const headers = new Headers(STREAM_HEADERS);
    headers.set(
      "Content-Type",
      response.headers.get("content-type") || stream.mimeType || "audio/mp4"
    );
    const contentLength =
      response.headers.get("content-length") || String(totalLength);
    headers.set("Content-Length", contentLength);
    return new Response(response.body, { status: 200, headers });
  }

  if (!response.body) {
    throw new Error("YouTube returned an empty audio response");
  }

  const headers = new Headers(STREAM_HEADERS);
  headers.set("Content-Type", response.headers.get("content-type") || stream.mimeType || "audio/mp4");

  const requestedLength = byteRange.end - byteRange.start + 1;
  headers.set("Content-Length", String(requestedLength));
  if (rangeHeader) {
    headers.set(
      "Content-Range",
      `bytes ${byteRange.start}-${byteRange.end}/${totalLength}`
    );
  }

  const body = createChunkedYoutubeBody(
    stream.url,
    response,
    firstEnd,
    byteRange.end
  );
  return new Response(body, { status: rangeHeader ? 206 : 200, headers });
}

// ─── Innertube singleton ────────────────────────────────────────────────────
let youtubeEngine: Innertube | null = null;
let engineInitPromise: Promise<Innertube> | null = null;

async function getYoutubeEngine(): Promise<Innertube> {
  if (youtubeEngine) return youtubeEngine;
  if (!engineInitPromise) {
    engineInitPromise = Innertube.create({
      cache: new UniversalCache(false),
      // generate_session_locally avoids fetching the player JS from YouTube's
      // CDN on every cold-start, which also prevents decipher failures when
      // the CDN is geo-blocked or slow.
      generate_session_locally: true,
    })
      .then((engine) => {
        youtubeEngine = engine;
        return engine;
      })
      .catch((err) => {
        engineInitPromise = null;
        throw err;
      });
  }
  return engineInitPromise;
}

// ─── Fallback: Public Piped / Invidious nodes ────────────────────────────────
// Listed roughly in order of reliability. Piped instances are preferred because
// they return `audioStreams` with direct CDN URLs.
const FALLBACK_PUBLIC_NODES = [
  "https://pipedapi.kavin.rocks",
  "https://api.piped.video",
  "https://pipedapi.tokhmi.xyz",
  "https://piped-api.lunar.icu",
  "https://api.piped.privacydev.net",
  "https://pipedapi.adminforge.de",
  "https://inv.tux.pizza",
  "https://invidious.jing.rocks",
];

async function streamFromFallbackNode(videoId: string, rangeHeader?: string): Promise<Response> {
  let unavailableStatus: 404 | 410 | null = null;

  for (const nodeUrl of FALLBACK_PUBLIC_NODES) {
    const provider = new URL(nodeUrl).hostname;
    try {
      const isPiped = nodeUrl.includes("piped");
      const endpoint = isPiped
        ? `${nodeUrl}/streams/${encodeURIComponent(videoId)}`
        : `${nodeUrl}/api/v1/videos/${encodeURIComponent(videoId)}`;

      const res = await fetch(endpoint, {
        headers: { "User-Agent": "AuraicSoundEngine/1.0" },
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) {
        unavailableStatus = (await getUnavailableStatus(res)) ?? unavailableStatus;
        console.warn("[sound-stream]", {
          stage: "fallback-metadata",
          provider,
          status: res.status,
        });
        continue;
      }
      const data = await res.json();
      const formats = isPiped
        ? (Array.isArray(data.audioStreams) ? data.audioStreams : []).map((format: any) => ({
            url: format.url,
            mimeType: format.mimeType,
            bitrate: Number(format.bitrate) || 0,
          }))
        : (Array.isArray(data.adaptiveFormats) ? data.adaptiveFormats : [])
            .filter((format: any) => format.type?.startsWith("audio/"))
            .map((format: any) => ({
              url: format.url,
              mimeType: format.type,
              bitrate: Number(format.bitrate) || 0,
            }));
      const validFormats = formats.filter((format: any) => {
        if (typeof format.url !== "string") return false;
        try {
          return ["http:", "https:"].includes(new URL(format.url).protocol);
        } catch {
          return false;
        }
      });
      validFormats.sort((a: any, b: any) => {
        const aIsMp4 = a.mimeType?.toLowerCase().includes("mp4") ? 1 : 0;
        const bIsMp4 = b.mimeType?.toLowerCase().includes("mp4") ? 1 : 0;
        return bIsMp4 - aIsMp4 || b.bitrate - a.bitrate;
      });

      for (const format of validFormats) {
        const streamResponse = await fetch(format.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "audio/mp4,audio/*;q=0.9,*/*;q=0.8",
            ...(rangeHeader ? { Range: rangeHeader } : {}),
          },
          redirect: "follow",
          cache: "no-store",
          signal: AbortSignal.timeout(15_000),
        });

        if (!streamResponse.ok) {
          unavailableStatus =
            (await getUnavailableStatus(streamResponse)) ?? unavailableStatus;
          console.warn("[sound-stream]", {
            stage: "fallback-upstream",
            provider,
            status: streamResponse.status,
          });
          continue;
        }

        const headers = new Headers(STREAM_HEADERS);
        headers.set(
          "Content-Type",
          streamResponse.headers.get("content-type")?.split(";")[0] ||
            format.mimeType?.split(";")[0] ||
            "audio/mp4"
        );
        for (const name of ["content-length", "content-range", "etag"]) {
          const value = streamResponse.headers.get(name);
          if (value) headers.set(name, value);
        }

        console.info("[sound-stream]", {
          stage: "fallback-upstream",
          provider,
          status: streamResponse.status,
        });
        return new Response(streamResponse.body, {
          status: streamResponse.status,
          headers,
        });
      }
    } catch (error) {
      console.warn("[sound-stream]", {
        stage: "fallback-provider",
        provider,
        outcome: error instanceof Error ? error.name : "unknown-error",
      });
    }
  }

  if (unavailableStatus) {
    throw new StreamRouteError(
      "VIDEO_UNAVAILABLE",
      unavailableStatus,
      "This video is unavailable or cannot be played."
    );
  }

  throw new StreamRouteError(
    "STREAM_UNAVAILABLE",
    502,
    "Audio stream is temporarily unavailable."
  );
}

// ─── Main handler ────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const cleanId = sanitizeStreamRequestTrackId(id || "");
  const rangeHeader = request.headers.get("range") || undefined;

  if (!YOUTUBE_TRACK_ID_PATTERN.test(cleanId)) {
    console.warn("[sound-stream]", {
      stage: "id-validation",
      outcome: "rejected",
    });
    return streamErrorResponse(
      new StreamRouteError(
        "INVALID_TRACK_ID",
        400,
        "Expected an 11-character YouTube video ID."
      )
    );
  }

  let youtubeUnavailableError: StreamRouteError | null = null;
  try {
    // YouTube Music tracks use YouTube video IDs. Try Innertube first, then
    // public YouTube-compatible nodes if format resolution or deciphering fails.
    try {
      return await streamFromYoutube(cleanId, rangeHeader);
    } catch (ytError: unknown) {
      if (
        ytError instanceof StreamRouteError &&
        (ytError.status === 404 || ytError.status === 410)
      ) {
        youtubeUnavailableError = ytError;
      }
      console.warn("[sound-stream]", {
        stage: "youtube-provider",
        outcome: "failed",
        unavailable: youtubeUnavailableError !== null,
      });
      return await streamFromFallbackNode(cleanId, rangeHeader);
    }
  } catch (error: unknown) {
    const fallbackUnavailable =
      error instanceof StreamRouteError &&
      (error.status === 404 || error.status === 410);
    const failure =
      fallbackUnavailable
        ? error
        : youtubeUnavailableError ??
          (error instanceof StreamRouteError
            ? error
            : new StreamRouteError(
                "STREAM_UNAVAILABLE",
                502,
                "Audio stream is temporarily unavailable."
              ));

    console.error("[sound-stream]", {
      stage: "request",
      code: failure.code,
      status: failure.status,
    });
    return streamErrorResponse(failure);
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { ...STREAM_HEADERS },
  });
}
