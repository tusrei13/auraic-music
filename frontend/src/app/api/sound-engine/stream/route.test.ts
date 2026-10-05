import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const getTrackByIdMock = vi.fn();

vi.mock("@/lib/sound-engine/server-engine", () => ({
  SoundEngineServer: {
    getTrackById: (id: string) => getTrackByIdMock(id),
  },
}));

async function requestStream(
  paramsObj: Record<string, string>,
  headersObj: Record<string, string> = {}
) {
  vi.resetModules();
  const { GET } = await import("./route");
  const params = new URLSearchParams(paramsObj);
  return GET(
    new NextRequest(`http://localhost:3001/api/sound-engine/stream?${params}`, {
      headers: headersObj,
    })
  );
}

describe("GET /api/sound-engine/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 404 when no id or url is provided", async () => {
    const res = await requestStream({});
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.code).toBe("STREAM_NOT_FOUND");
  });

  it("proxies direct MP3 url successfully", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": "3",
        },
      })
    );

    const res = await requestStream({ url: "https://example.com/audio.mp3" });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/audio.mp3",
      expect.objectContaining({ redirect: "follow" })
    );
  });

  it("resolves track ID to streamUrl and proxies", async () => {
    getTrackByIdMock.mockResolvedValueOnce({
      id: "123",
      streamUrl: "https://example.com/stream-123.mp3",
    });

    fetchMock.mockResolvedValueOnce(
      new Response(new Uint8Array([1, 2]), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": "2",
        },
      })
    );

    const res = await requestStream({ id: "123" });
    expect(res.status).toBe(200);
    expect(getTrackByIdMock).toHaveBeenCalledWith("123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/stream-123.mp3",
      expect.anything()
    );
  });

  it("forwards byte ranges to upstream audio", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(new Uint8Array([1]), {
        status: 206,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": "1",
          "Content-Range": "bytes 0-0/100",
        },
      })
    );

    const res = await requestStream(
      { url: "https://example.com/audio.mp3" },
      { Range: "bytes=0-0" }
    );
    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Range")).toBe("bytes 0-0/100");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/audio.mp3",
      expect.objectContaining({
        headers: expect.objectContaining({ Range: "bytes=0-0" }),
      })
    );
  });

  it("handles upstream failure with 502 error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network timeout"));

    const res = await requestStream({ url: "https://example.com/audio.mp3" });
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.code).toBe("STREAM_UNAVAILABLE");
  });
});
