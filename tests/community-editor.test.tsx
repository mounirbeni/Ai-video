// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CommunityEditor, { DeleteCommunityPost } from "../src/components/CommunityEditor";
import { I18nProvider } from "../src/lib/i18n/client";
vi.mock("../src/app/actions/community", () => ({ saveCommunityPost: vi.fn(), deleteCommunityPost: vi.fn() }));
afterEach(cleanup);

it("starts privately and makes publishing an explicit choice", () => {
  render(<CommunityEditor />);
  const publish=screen.getByRole("checkbox",{name:/Publish for members/});
  expect((publish as HTMLInputElement).checked).toBe(false);
  expect(screen.getByRole("button",{name:"Save draft"})).toBeTruthy();
  expect((screen.getByRole("checkbox",{name:"Pin at the top of the community"}) as HTMLInputElement).disabled).toBe(true);
  fireEvent.click(publish);
  expect(screen.getByRole("button",{name:"Save and publish"})).toBeTruthy();
});

it("requires a separate explicit deletion confirmation and supports Arabic", () => {
  render(<I18nProvider locale="ar"><DeleteCommunityPost id="cvalidcommunityid" version={0} /></I18nProvider>);
  expect(screen.queryByRole("button",{name:"نعم، احذف المنشور"})).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"حذف هذا المنشور"}));
  expect(screen.getByRole("button",{name:"نعم، احذف المنشور"})).toBeTruthy();
  fireEvent.click(screen.getByRole("button",{name:"إلغاء"}));
  expect(screen.queryByRole("button",{name:"نعم، احذف المنشور"})).toBeNull();
});
