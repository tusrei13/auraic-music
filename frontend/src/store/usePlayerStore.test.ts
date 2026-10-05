import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeTrack, removeDuplicateTracks, usePlayerStore, type Track } from "./usePlayerStore";

afterEach(() => {
  vi.useRealTimers();
});

const track = (id: number | string): Track => ({
  id,
  title: `Track ${id}`,
  artist: "Artist",
  image: "cover.jpg",
  audioUrl: "track.mp3",
});

describe("removeDuplicateTracks", () => {
  it("keeps the first occurrence of each track id", () => {
    expect(removeDuplicateTracks([track(1), track(1), track(2)])).toEqual([
      track(1),
      track(2),
    ]);
  });

  it("ignores empty tracks without changing valid queue items", () => {
    expect(removeDuplicateTracks([track(1), null as unknown as Track, track(2)])).toEqual([
      track(1),
      track(2),
    ]);
  });
});

describe("playback stream errors", () => {
  it("advances only once when the same track reports repeated errors", () => {
    vi.useFakeTimers();
    const tracks = [track(1), track(2), track(3)];
    const player = usePlayerStore.getState();

    player.playTrack(tracks[0], tracks);
    player.handlePlaybackError("Network error");
    usePlayerStore.getState().setPlaybackStatus("error", "Network error");

    vi.advanceTimersByTime(1500);
    expect(usePlayerStore.getState().currentTrack?.id).toBe(2);
  });
});

describe("normalizeTrack stream URLs", () => {
  it("infers engine source and builds stream URL for engine tracks", () => {
    const normalized = normalizeTrack({
      ...track("12345"),
      isEngineTrack: true,
    });

    expect(normalized.streamSource).toBe("engine");
    expect(normalized.audioUrl).toBe("/api/sound-engine/stream?id=12345");
  });
});

