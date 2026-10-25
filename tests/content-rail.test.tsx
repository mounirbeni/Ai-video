// @vitest-environment jsdom
import Link from "next/link";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import ContentRail from "../src/components/ContentRail";
import { I18nProvider } from "../src/lib/i18n/client";

let resize: () => void;
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { constructor(callback: () => void) { resize = callback; } observe() {} disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", () => 1);
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function setup(locale: "en" | "ar", overflow = true) {
  const title = locale === "ar" ? "قصص" : "Stories";
  render(<I18nProvider locale={locale}><ContentRail title={title}><Link href="/title/one">One</Link><Link href="/title/two">Two</Link></ContentRail></I18nProvider>);
  const rail = screen.getByRole("region", { name: title });
  Object.defineProperties(rail, { clientWidth: { value: 400 }, scrollWidth: { value: overflow ? 1000 : 400 } });
  const scroll = vi.fn((options: ScrollToOptions) => {
    const next = rail.scrollLeft + (options.left || 0);
    rail.scrollLeft = locale === "ar" ? Math.max(-600, Math.min(0, next)) : Math.max(0, Math.min(600, next));
    fireEvent.scroll(rail);
  });
  Object.defineProperty(rail, "scrollBy", { value: scroll });
  act(() => resize());
  return { rail, scroll };
}

it("moves forwards and backwards and disables the relevant edge in English", () => {
  const { rail } = setup("en");
  const previous = screen.getByRole("button", { name: "Previous titles in Stories" });
  const next = screen.getByRole("button", { name: "Next titles in Stories" });
  expect(previous.hasAttribute("disabled")).toBe(true);
  fireEvent.click(next); expect(rail.scrollLeft).toBeGreaterThan(0);
  fireEvent.click(next); expect(next.hasAttribute("disabled")).toBe(true);
  fireEvent.click(previous); expect(next.hasAttribute("disabled")).toBe(false);
});

it("moves in the correct direction in Arabic and preserves the same edge behavior", () => {
  const { rail } = setup("ar");
  const previous = screen.getByRole("button", { name: "الأعمال السابقة في قصص" });
  const next = screen.getByRole("button", { name: "الأعمال التالية في قصص" });
  expect(previous.hasAttribute("disabled")).toBe(true);
  fireEvent.click(next); expect(rail.scrollLeft).toBeLessThan(0);
  fireEvent.click(next); expect(next.hasAttribute("disabled")).toBe(true);
  fireEvent.click(previous); expect(previous.hasAttribute("disabled")).toBe(false);
});

it("does not animate scrolling when reduced motion is requested", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
  const { scroll } = setup("en");
  fireEvent.click(screen.getByRole("button", { name: "Next titles in Stories" }));
  expect(scroll.mock.calls[0][0].behavior).toBe("instant");
});

it("keeps a short collection keyboard accessible without unnecessary arrow controls", () => {
  const { rail } = setup("en", false);
  expect(screen.queryByRole("button")).toBeNull();
  expect(rail.getAttribute("tabindex")).toBe("0");
  expect(screen.getByRole("link", { name: "One" }).getAttribute("href")).toBe("/title/one");
});
