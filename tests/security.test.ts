import { describe, expect, it } from "vitest";
import { sessionSecret, validSessionVersion } from "../src/lib/session-security";
import { validProgress } from "../src/lib/progress";
import { parseSubtitles, readSubtitles } from "../src/lib/subtitles";

describe("session policy", () => {
  it("rejects absent and short production secrets", () => {
    expect(() => sessionSecret("", true)).toThrow();
    expect(() => sessionSecret("dev-secret", true)).toThrow();
    expect(sessionSecret("x".repeat(32), true).length).toBe(32);
  });
  it("rejects old, missing and malformed session versions", () => {
    expect(validSessionVersion(1, 1)).toBe(true);
    for (const claim of [0, undefined, "1", null, 1.2]) expect(validSessionVersion(claim, 1)).toBe(false);
  });
});

describe("watch progress validation", () => {
  it("accepts valid progress and rejects nonfinite, negative and unbounded input", () => {
    expect(validProgress({ key: "episode1", seconds: 120, completed: true })).toBe(true);
    for (const seconds of [NaN, Infinity, -1, 7 * 86400 + 1, "120"]) expect(validProgress({ key: "episode1", seconds })).toBe(false);
    expect(validProgress({ key: "", seconds: 1 })).toBe(false);
    expect(validProgress({ key: "a", seconds: 1, completed: "yes" })).toBe(false);
  });
});

describe("subtitle validation", () => {
  it("parses bilingual tracks and rejects executable or non-VTT sources", () => {
    expect(parseSubtitles("ar | العربية | https://example.com/ar.vtt\nen | English | https://example.com/en.vtt")).toHaveLength(2);
    expect(readSubtitles([{ language: "ar", label: "Arabic", src: "javascript:alert(1)" }])).toEqual([]);
    expect(() => parseSubtitles("ar | Arabic | https://example.com/file.html")).toThrow();
    expect(() => parseSubtitles("broken")).toThrow();
  });
});
