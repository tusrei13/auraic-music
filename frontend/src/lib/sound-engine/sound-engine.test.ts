import { describe, it, expect } from "vitest";
import { AuraicAudioAdapter, isValidTrackId, normalizeTrackTitle } from "./client";
import { EngineTrack } from "@/types/sound-engine";
import { normalizeTrack } from "@/store/usePlayerStore";
import { sanitizeStreamRequestTrackId, sanitizeTrackId } from "./track-id";

describe("Sound Engine Adapter & Utilities", () => {
  const mockEngineTrack: EngineTrack = {
    id: "987654",
    title: "Cyber Horizon",
    artistName: "Neon Driver",
    artworkUrl: "https://example.com/art-hd.jpg",
    streamUrl: "https://example.com/stream-987654.mp3",
    duration: 210,
    genre: "Synthwave",
    license: "https://creativecommons.org/licenses/by-nc/3.0/",
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

  it("identifies Engine track IDs", () => {
    expect(AuraicAudioAdapter.isEngineTrackId("engine:987654")).toBe(true);
    expect(AuraicAudioAdapter.isEngineTrackId("987654")).toBe(true);
    expect(AuraicAudioAdapter.isEngineTrackId(12345)).toBe(true);
    expect(AuraicAudioAdapter.isEngineTrackId("")).toBe(false);
  });

  describe("stream track ID sanitization", () => {
    it("sanitizes compound engine IDs cleanly", () => {
      expect(sanitizeStreamRequestTrackId("engine:987654")).toBe("987654");
    });

    it("decodes encoded URI parameters", () => {
      expect(sanitizeStreamRequestTrackId("engine%3A987654%3Fsource%3Dengine")).toBe("987654");
    });

    it("sanitizes track ID with sanitizeTrackId helper", () => {
      expect(sanitizeTrackId("engine:987654")).toBe("987654");
      expect(sanitizeTrackId("987654")).toBe("987654");
    });
  });

  describe("normalizeTrackTitle helper", () => {
    it("splits 'Artist - Track' cleanly into separate properties", () => {
      const res = normalizeTrackTitle("Alan Walker - Faded");
      expect(res.artistName).toBe("Alan Walker");
      expect(res.title).toBe("Faded");
    });

    it("splits 'Artist : Track' with colon delimiter", () => {
      const res = normalizeTrackTitle("Hans Zimmer : Time");
      expect(res.artistName).toBe("Hans Zimmer");
      expect(res.title).toBe("Time");
    });

    it("strips common noise tags from track titles", () => {
      const res = normalizeTrackTitle("Artist - Beautiful Day [Official Audio]");
      expect(res.artistName).toBe("Artist");
      expect(res.title).toBe("Beautiful Day");
    });

    it("extracts featured artist from 'Track (feat. Artist)'", () => {
      const res = normalizeTrackTitle("Good Life (feat. OneRepublic)");
      expect(res.artistName).toContain("OneRepublic");
      expect(res.title).toBe("Good Life");
    });

    it("falls back to default artist if no delimiter exists", () => {
      const res = normalizeTrackTitle("Midnight City", "M83");
      expect(res.artistName).toBe("M83");
      expect(res.title).toBe("Midnight City");
    });
  });

  it("validates track IDs", () => {
    expect(isValidTrackId("987654")).toBe(true);
    expect(isValidTrackId("track_abc_123")).toBe(true);
    expect(isValidTrackId("")).toBe(false);
  });

  it("extracts raw ID cleanly from compound ID", () => {
    expect(AuraicAudioAdapter.extractRawId("engine:987654")).toBe("987654");
    expect(AuraicAudioAdapter.extractRawId("987654")).toBe("987654");
  });

  it("adapts EngineTrack data to the player track structure", () => {
    const playerTrack = AuraicAudioAdapter.toPlayerTrack(mockEngineTrack);

    expect(playerTrack.id).toBe("987654");
    expect(playerTrack.title).toBe("Cyber Horizon");
    expect(playerTrack.audioUrl).toBe("https://example.com/stream-987654.mp3");
    expect(playerTrack.image).toBe("https://example.com/art-hd.jpg");
    expect(playerTrack.duration).toBe(210);
    expect(playerTrack.genre).toBe("Synthwave");
    expect(typeof playerTrack.artist).toBe("object");
    expect((playerTrack.artist as any).name).toBe("Neon Driver");
  });

  it("normalizes EngineTrack in usePlayerStore helper", () => {
    const normalized = normalizeTrack(mockEngineTrack);

    expect(normalized.isEngineTrack).toBe(true);
    expect(normalized.id).toBe("987654");
    expect(normalized.rawEngineTrack).toBe(mockEngineTrack);
    expect(normalized.audioUrl).toBe("https://example.com/stream-987654.mp3");
  });
});
