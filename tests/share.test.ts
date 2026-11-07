import { afterEach, expect, it } from "vitest";
import { absoluteUrl, siteUrl, summarize } from "../src/lib/share";

const saved = process.env.APP_URL;
afterEach(() => { if (saved === undefined) delete process.env.APP_URL; else process.env.APP_URL = saved; });

it("builds absolute URLs from APP_URL for site-relative and remote images", () => {
  process.env.APP_URL = "https://nexora.example/some/path";
  expect(siteUrl()).toBe("https://nexora.example");
  expect(absoluteUrl("/media/poster.jpg")).toBe("https://nexora.example/media/poster.jpg");
  expect(absoluteUrl("https://cdn.test/a.jpg")).toBe("https://cdn.test/a.jpg");
  expect(absoluteUrl(null)).toBeUndefined();
});

it("summarizes descriptions at a word boundary without exceeding the limit", () => {
  expect(summarize("short  text\nhere")).toBe("short text here");
  const long = summarize("word ".repeat(100), 50);
  expect(long.length).toBeLessThanOrEqual(50);
  expect(long.endsWith("…")).toBe(true);
});
