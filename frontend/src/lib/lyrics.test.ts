import { describe, expect, it } from "vitest";
import { normalizeLyrics, parseLrc } from "./lyrics";

describe("parseLrc", () => {
  it("parses and sorts timestamped lines", () => {
    expect(parseLrc("[00:04.50]Second\n[00:01.25]First")).toEqual([
      { time: 1.25, text: "First" },
      { time: 4.5, text: "Second" },
    ]);
  });

  it("supports multiple timestamps for one line", () => {
    expect(parseLrc("[00:01.00][00:02.00]Repeat")).toEqual([
      { time: 1, text: "Repeat" },
      { time: 2, text: "Repeat" },
    ]);
  });

  it("keeps existing JSON lyrics compatible", () => {
    expect(normalizeLyrics([{ time: 3, text: "Line" }])).toEqual([{ time: 3, text: "Line" }]);
    expect(normalizeLyrics(undefined)).toEqual([]);
  });
});
