import { describe, expect, it } from "vitest";
import { extractTranscript } from "./useVoiceSearch";

describe("extractTranscript", () => {
  it("returns empty string and hasFinal false for empty results", () => {
    const res = extractTranscript([]);
    expect(res).toEqual({ transcript: "", hasFinal: false });
  });

  it("extracts interim transcript correctly", () => {
    const results = [
      { isFinal: false, 0: { transcript: "nhạc" } },
    ];
    const res = extractTranscript(results);
    expect(res).toEqual({ transcript: "nhạc", hasFinal: false });
  });

  it("extracts final transcript and detects hasFinal true", () => {
    const results = [
      { isFinal: true, 0: { transcript: "nhạc chill acoustic" } },
    ];
    const res = extractTranscript(results);
    expect(res).toEqual({ transcript: "nhạc chill acoustic", hasFinal: true });
  });

  it("combines final and interim transcript without duplicates", () => {
    const results = [
      { isFinal: true, 0: { transcript: "sơn tùng " } },
      { isFinal: false, 0: { transcript: "m-tp" } },
    ];
    const res = extractTranscript(results);
    expect(res).toEqual({ transcript: "sơn tùng m-tp", hasFinal: true });
  });

  it("prevents transcript duplication on subsequent events containing cumulative results", () => {
    // In Chromium, event 1 might have:
    const event1 = [
      { isFinal: false, 0: { transcript: "ambient" } },
    ];
    expect(extractTranscript(event1).transcript).toBe("ambient");

    // Event 2 finalizes item 0:
    const event2 = [
      { isFinal: true, 0: { transcript: "ambient" } },
    ];
    expect(extractTranscript(event2).transcript).toBe("ambient");

    // Event 3 engine repeats final item 0:
    const event3 = [
      { isFinal: true, 0: { transcript: "ambient" } },
    ];
    // Stateless accumulation ensures it stays "ambient", not "ambient ambient"
    expect(extractTranscript(event3).transcript).toBe("ambient");
  });
});
