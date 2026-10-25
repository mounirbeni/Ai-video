// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Player from "../src/components/Player";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

it("shows an access message on expired access and lets the viewer retry", async () => {
  const fetcher = vi.fn().mockResolvedValue({ status: 403 });
  vi.stubGlobal("fetch", fetcher);
  const { container } = render(createElement(Player, { src: "/api/stream/title/test", startAt: 120, subtitles: [{ language: "ar", label: "العربية", src: "https://example.com/ar.vtt" }] }));
  const video = container.querySelector("video")!;
  Object.defineProperty(video, "duration", { value: 600 });
  fireEvent.loadedMetadata(video);
  expect(video.currentTime).toBe(120);
  expect(container.querySelector("track")?.getAttribute("srcLang")).toBe("ar");
  fireEvent.error(video);
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Your access has expired"));
  expect(fetcher).toHaveBeenCalledWith("/api/stream/title/test", { method: "HEAD", redirect: "manual" });
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(screen.queryByRole("alert")).toBeNull();
});

it("stops retrying after three automatic reloads and shows a network error", async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn().mockResolvedValue({ status: 200 });
  vi.stubGlobal("fetch", fetcher);
  const { container } = render(createElement(Player, { src: "/api/stream/title/test", startAt: 0 }));
  const video = container.querySelector("video")!;
  for (let n = 0; n < 4; n++) {
    await act(async () => { fireEvent.error(video); await Promise.resolve(); });
    if (n < 3) await act(async () => { await vi.advanceTimersByTimeAsync((n + 1) * 1000); });
  }
  expect(fetcher).toHaveBeenCalledTimes(4);
  expect(screen.getByRole("alert").textContent).toContain("We couldn’t play this video");
});
