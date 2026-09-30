import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createMock, shimEvalMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  shimEvalMock: vi.fn(),
}));

vi.mock("youtubei.js", () => ({
  Innertube: { create: createMock },
  Platform: { shim: { eval: shimEvalMock } },
  UniversalCache: vi.fn(),
}));

const getBasicInfoMock = vi.fn();
const fetchMock = vi.fn(
  async (_input: RequestInfo | URL, _init?: RequestInit) =>
    new Response(new Uint8Array([1]), {
      status: 206,
      headers: {
        "Content-Type": "audio/mp4",
        "Content-Length": "1",
        "Content-Range": "bytes 0-0/1",
      },
    })
);

function audioInfo(contentLength = "1") {
  return {
    chooseFormat: () => ({
      url: "https://googlevideo.test/audio",
      mime_type: 'audio/mp4; codecs="mp4a.40.2"',
      bitrate: 128_000,
      content_length: contentLength,
    }),
    audioFormats: [],
  };
}

async function requestStream(
  id: string,
  options: { range?: string; source?: string } = {}
) {
  vi.resetModules();
  const { GET } = await import("./route");
  const params = new URLSearchParams({ id });
  if (options.source) params.set("source", options.source);
  const headers = options.range ? { Range: options.range } : undefined;

  return GET(
    new NextRequest(`http://localhost:3001/api/sound-engine/stream?${params}`, {
      headers,
    })
  );
}

describe("GET /api/sound-engine/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(
      new Response(new Uint8Array([1]), {
        status: 206,
        headers: {
          "Content-Type": "audio/mp4",
          "Content-Length": "1",
          "Content-Range": "bytes 0-0/1",
        },
      })
    );
    getBasicInfoMock.mockResolvedValue(audioInfo());
    createMock.mockResolvedValue({
      getBasicInfo: getBasicInfoMock,
      session: { player: {} },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a stable 400 error for malformed IDs", async () => {
    const response = await requestStream("not-a-video-id");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: "INVALID_TRACK_ID",
      message: "Expected an 11-character YouTube video ID.",
    });
    expect(createMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves a valid ID beginning with a hyphen", async () => {
    const response = await requestStream("-abcdefg123");

    expect(response.status).toBe(200);
    expect(getBasicInfoMock).toHaveBeenCalledWith("-abcdefg123", {
      client: "ANDROID",
    });
  });

  it("ignores the source parameter and uses YouTube", async () => {
    const response = await requestStream("dQw4w9WgXcQ", {
      source: "not-youtube",
    });

    expect(response.status).toBe(200);
    expect(createMock).toHaveBeenCalledOnce();
    expect(getBasicInfoMock).toHaveBeenCalledWith("dQw4w9WgXcQ", {
      client: "ANDROID",
    });
  });

  it("forwards an open-ended Range header and returns the upstream 206", async () => {
    const response = await requestStream("dQw4w9WgXcQ", {
      range: "bytes=0-",
    });

    expect(response.status).toBe(206);
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");
    expect(response.headers.get("Content-Type")).toBe("audio/mp4");
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "*/*",
      Range: "bytes=0-0",
    });
  });

  it("proxies open-ended ranges through bounded upstream chunks", async () => {
    const totalLength = 2 * 1024 * 1024 + 17;
    getBasicInfoMock.mockResolvedValue(audioInfo(String(totalLength)));
    fetchMock.mockImplementation(async (_input, init) => {
      const requestRange = new Headers(init?.headers).get("Range");
      const match = requestRange?.match(/^bytes=(\d+)-(\d+)$/);
      if (!match) return new Response("invalid range", { status: 416 });

      const start = Number(match[1]);
      const end = Number(match[2]);
      if (end - start + 1 > 1024 * 1024) {
        return new Response("range too large", { status: 403 });
      }

      const length = end - start + 1;
      return new Response(new Uint8Array(length), {
        status: 206,
        headers: {
          "Content-Type": "audio/mp4",
          "Content-Length": String(length),
          "Content-Range": `bytes ${start}-${end}/${totalLength}`,
        },
      });
    });

    const response = await requestStream("dQw4w9WgXcQ", {
      range: "bytes=0-",
    });
    const body = await response.arrayBuffer();

    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Length")).toBe(String(totalLength));
    expect(response.headers.get("Content-Range")).toBe(
      `bytes 0-${totalLength - 1}/${totalLength}`
    );
    expect(body.byteLength).toBe(totalLength);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("falls back to a node when youtubei.js initialization fails", async () => {
    createMock.mockRejectedValueOnce(new Error("Innertube unavailable"));
    fetchMock.mockImplementation(async (input) => {
      if (String(input).includes("/streams/")) {
        return new Response(
          JSON.stringify({
            audioStreams: [
              {
                url: "https://fallback.test/audio",
                mimeType: "audio/mp4",
                bitrate: 128_000,
              },
            ],
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(new Uint8Array([1]), {
        status: 206,
        headers: {
          "Content-Type": "audio/mp4",
          "Content-Length": "1",
          "Content-Range": "bytes 0-0/1",
        },
      });
    });

    const response = await requestStream("dQw4w9WgXcQ", {
      range: "bytes=0-0",
    });

    expect(response.status).toBe(206);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/streams/dQw4w9WgXcQ");
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toMatchObject({
      Range: "bytes=0-0",
    });
  });

  it("returns a stable 502 JSON error when every provider fails", async () => {
    createMock.mockRejectedValueOnce(new Error("Innertube unavailable"));
    fetchMock.mockResolvedValue(
      new Response("provider unavailable", { status: 503 })
    );

    const response = await requestStream("dQw4w9WgXcQ");

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      code: "STREAM_UNAVAILABLE",
      message: "Audio stream is temporarily unavailable.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  it("falls back after an upstream 403 and returns JSON if fallback nodes fail", async () => {
    fetchMock.mockImplementation(async (input) => {
      if (String(input).startsWith("https://googlevideo.test/")) {
        return new Response("forbidden", { status: 403 });
      }
      return new Response("node unavailable", { status: 503 });
    });

    const response = await requestStream("dQw4w9WgXcQ");

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      code: "STREAM_UNAVAILABLE",
      message: expect.any(String),
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://googlevideo.test/audio"
    );
    expect(fetchMock.mock.calls[1]?.[0]).toContain("/streams/dQw4w9WgXcQ");
  });

  it("returns a stable unavailable response for confirmed 410 content", async () => {
    fetchMock.mockImplementation(async (input) => {
      if (String(input).startsWith("https://googlevideo.test/")) {
        return new Response("gone", { status: 410 });
      }
      return new Response("node unavailable", { status: 503 });
    });

    const response = await requestStream("dQw4w9WgXcQ");

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toEqual({
      code: "VIDEO_UNAVAILABLE",
      message: "This video is unavailable or cannot be played.",
    });
  });
});
