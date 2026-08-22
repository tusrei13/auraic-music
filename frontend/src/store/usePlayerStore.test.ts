import { describe, expect, it } from "vitest";
import { removeDuplicateTracks, type Track } from "./usePlayerStore";
import { isJamendoTrackId } from "../lib/api";

const track = (id: number): Track => ({
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

describe("isJamendoTrackId", () => {
  it("recognizes external Jamendo IDs without treating numeric IDs as external", () => {
    expect(isJamendoTrackId("jamendo:123")).toBe(true);
    expect(isJamendoTrackId(123)).toBe(false);
  });
});
