import { describe, it, expect } from "vitest";
import { AuraicAudioAdapter, isValidTrackId } from "./client";
import { EngineTrack } from "@/types/sound-engine";
import { normalizeTrack } from "@/store/usePlayerStore";
import { sanitizeStreamRequestTrackId, sanitizeTrackId } from "./track-id";

describe("AuraicAudioAdapter", () => {
  const mockEngineTrack: EngineTrack = {
    id: "dQw4w9WgXcQ",
    title: "Cyber Horizon",
    duration: 210,
    genre: "Synthwave",
    is_streamable: true,
    user: {
      id: "artist_123",
      name: "Neon Driver",
      handle: "neondriver",
      is_verified: true,
      profile_picture: {
        "480x480": "https://example.com/avatar.jpg",
      },
    },
    artwork: {
      "1000x1000": "https://example.com/art-hd.jpg",
      "480x480": "https://example.com/art-md.jpg",
    },
    play_count: 54200,
  };

  it("correctly identifies YouTube Music track IDs", () => {
    expect(AuraicAudioAdapter.isYouTubeTrackId("youtube:dQw4w9WgXcQ")).toBe(true);
    expect(AuraicAudioAdapter.isYouTubeTrackId("dQw4w9WgXcQ")).toBe(false);
    expect(AuraicAudioAdapter.isYouTubeTrackId(12345)).toBe(false);
  });

  describe("stream track ID sanitization", () => {
    it("removes a stray leading hyphen from an overlong YouTube ID", () => {
      expect(sanitizeStreamRequestTrackId("-7IID5YLPg7w")).toBe("7IID5YLPg7w");
    });

    it("preserves a valid 11-character YouTube ID that starts with a hyphen", () => {
      expect(sanitizeStreamRequestTrackId("-abcdefg123")).toBe("-abcdefg123");
    });

    it("decodes the ID and removes source query pollution", () => {
      expect(sanitizeStreamRequestTrackId("youtube%3A7IID5YLPg7w%3Fsource%3Dengine"))
        .toBe("7IID5YLPg7w");
    });

    it("only applies the stray-hyphen correction to explicit YouTube tracks", () => {
      expect(sanitizeTrackId("-7IID5YLPg7w")).toBe("-7IID5YLPg7w");
      expect(sanitizeTrackId("-7IID5YLPg7w", "youtube")).toBe("7IID5YLPg7w");
    });
  });

  it("only accepts valid YouTube video IDs", () => {
    expect(isValidTrackId("dQw4w9WgXcQ")).toBe(true);
    expect(isValidTrackId("youtube:dQw4w9WgXcQ")).toBe(true);
    expect(isValidTrackId("xkQaGx")).toBe(false);
    expect(isValidTrackId("")).toBe(false);
  });

  it("extracts raw ID cleanly from compound ID", () => {
    expect(AuraicAudioAdapter.extractRawId("engine:dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(AuraicAudioAdapter.extractRawId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("adapts YouTube Music data to the player stream proxy URL", () => {
    const playerTrack = AuraicAudioAdapter.toPlayerTrack(mockEngineTrack);

    expect(playerTrack.id).toBe("youtube:dQw4w9WgXcQ");
    expect(playerTrack.title).toBe("Cyber Horizon");
    expect(playerTrack.audioUrl).toBe("/api/sound-engine/stream?id=dQw4w9WgXcQ&source=youtube");
    expect(playerTrack.image).toBe("https://example.com/art-hd.jpg");
    expect(playerTrack.duration).toBe(210);
    expect(playerTrack.genre).toBe("Synthwave");
    expect(typeof playerTrack.artist).toBe("object");
    expect((playerTrack.artist as any).name).toBe("Neon Driver");
  });

  it("removes a stray leading hyphen from YouTube track IDs", () => {
    const playerTrack = AuraicAudioAdapter.toPlayerTrack({
      ...mockEngineTrack,
      id: "-7IID5YLPg7w",
      streamSource: "youtube",
    });

    expect(playerTrack.id).toBe("youtube:7IID5YLPg7w");
    expect(playerTrack.audioUrl).toBe(
      "/api/sound-engine/stream?id=7IID5YLPg7w&source=youtube"
    );
  });

  it("normalizes EngineTrack in usePlayerStore helper", () => {
    const normalized = normalizeTrack(mockEngineTrack);

    expect(normalized.isEngineTrack).toBe(true);
    expect(normalized.id).toBe("youtube:dQw4w9WgXcQ");
    expect(normalized.rawEngineTrack).toBe(mockEngineTrack);
  });
});
