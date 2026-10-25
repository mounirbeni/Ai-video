// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AVATARS, getAvatar } from "../src/lib/avatars";
import AvatarPicker from "../src/components/AvatarPicker";
import UserAvatar from "../src/components/UserAvatar";
import { I18nProvider } from "../src/lib/i18n/client";

vi.mock("../src/app/actions/avatar", () => ({ updateAvatar: vi.fn() }));
afterEach(cleanup);

it("provides ten unique choices with separate atlas cells", () => {
  expect(AVATARS).toHaveLength(10);
  expect(new Set(AVATARS.map((a) => a.id)).size).toBe(10);
  expect(new Set(AVATARS.map((a) => `${a.column}:${a.row}`)).size).toBe(10);
});

it("previews a selection without saving until the form is submitted", () => {
  render(<AvatarPicker currentAvatarId={null} name="Nexora" />);
  expect(screen.getAllByRole("radio")).toHaveLength(11); // ten presets plus initials
  fireEvent.click(screen.getByRole("radio", { name: "Ember · Fox" }));
  expect((screen.getByRole("radio", { name: "Ember · Fox" }) as HTMLInputElement).checked).toBe(true);
  expect(screen.getByRole("img", { name: "Ember · Fox" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Save avatar" })).toBeTruthy();
  fireEvent.click(screen.getByRole("radio", { name: "Use my initials instead" }));
  expect(screen.getByRole("img", { name: "Your initials" }).textContent).toBe("N");
});

it("shows saved choices and localized Arabic controls", () => {
  render(<I18nProvider locale="ar"><AvatarPicker currentAvatarId="nova" name="نكسورا" /></I18nProvider>);
  expect((screen.getByRole("radio", { name: "نوفا · روبوت" }) as HTMLInputElement).checked).toBe(true);
  expect(screen.getByRole("button", { name: "حفظ الصورة" })).toBeTruthy();
});

it("falls back to initials for a missing or invalid preset instead of loading a user-provided URL", () => {
  expect(getAvatar("https://example.com/avatar.png")).toBeUndefined();
  render(<UserAvatar avatarId="https://example.com/avatar.png" name="Nexora" />);
  expect(screen.getByRole("img", { name: "Nexora" }).textContent).toBe("N");
  expect(screen.getByRole("img").style.backgroundImage).toBe("");
});
