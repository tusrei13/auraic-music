import { describe, it, expect } from "vitest";
import { AuraicAudioAdapter } from "./client";
import { EngineTrack } from "@/types/sound-engine";
import { normalizeTrack } from "@/store/usePlayerStore";

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
    repost_count: 3100,
  };

  it("correctly identifies engine track IDs", () => {
    expect(AuraicAudioAdapter.isEngineTrackId("engine:dQw4w9WgXcQ")).toBe(true);
    expect(AuraicAudioAdapter.isEngineTrackId("dQw4w9WgXcQ")).toBe(false);
    expect(AuraicAudioAdapter.isEngineTrackId(12345)).toBe(false);
  });

  it("extracts raw ID cleanly from compound ID", () => {
    expect(AuraicAudioAdapter.extractRawId("engine:dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(AuraicAudioAdapter.extractRawId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("adapts EngineTrack to Player Track interface with 320kbps stream proxy URL", () => {
    const playerTrack = AuraicAudioAdapter.toPlayerTrack(mockEngineTrack);

    expect(playerTrack.id).toBe("engine:dQw4w9WgXcQ");
    expect(playerTrack.title).toBe("Cyber Horizon");
    expect(playerTrack.audioUrl).toBe("/api/sound-engine/stream?id=dQw4w9WgXcQ");
    expect(playerTrack.image).toBe("https://example.com/art-hd.jpg");
    expect(playerTrack.duration).toBe(210);
    expect(playerTrack.genre).toBe("Synthwave");
    expect(typeof playerTrack.artist).toBe("object");
    expect((playerTrack.artist as any).name).toBe("Neon Driver");
  });

  it("normalizes EngineTrack in usePlayerStore helper", () => {
    const normalized = normalizeTrack(mockEngineTrack);

    expect(normalized.isEngineTrack).toBe(true);
    expect(normalized.id).toBe("engine:dQw4w9WgXcQ");
    expect(normalized.rawEngineTrack).toBe(mockEngineTrack);
  });
});
