import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ cookies: new Map<string, string>(), userId: "", capture: "", item: "monthly" }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (k: string) => state.cookies.has(k) ? { value: state.cookies.get(k) } : undefined, set: (k: string, v: string) => state.cookies.set(k, v), delete: (k: string) => state.cookies.delete(k) }),
  headers: async () => new Headers({ "x-forwarded-for": "127.0.0.1" }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("../src/lib/paypal", () => ({
  captureOrder: async () => ({ id: state.capture, custom_id: `${state.userId}:${state.item}`, amount: { value: "49.99", currency_code: "USD" } }),
  usdValue: () => "4.99", centsToUsd: (c: number) => (c / 100).toFixed(2),
}));
vi.mock("../src/lib/mail", () => ({ sendMail: vi.fn(async () => {}), mailConfigured: false }));

import { db } from "../src/lib/db";
import { createSession, getUser } from "../src/lib/auth";
import { changePassword, resetPassword } from "../src/app/actions/auth";
import { issueToken } from "../src/lib/tokens";
import { consumeLimit } from "../src/lib/rate-limit";
import { POST as capture } from "../src/app/api/paypal/capture/route";
import { POST as progress } from "../src/app/api/progress/route";
import { redeemCode, decidePayment } from "../src/app/actions/payments";
import { updateAvatar } from "../src/app/actions/avatar";
import { AVATARS } from "../src/lib/avatars";
import { setWatchlist } from "../src/app/actions/library";
import bcrypt from "bcryptjs";

// Integration tests must use an explicit isolated database; never fall back to DATABASE_URL.
const enabled = !!process.env.TEST_DATABASE_URL;
if (enabled) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!enabled)("Postgres account, payment and library flows", () => {
  beforeAll(async () => {
    if (!new URL(process.env.TEST_DATABASE_URL!).pathname.endsWith("/nexora_test")) throw new Error("Use a database named nexora_test");
    process.env.AUTH_SECRET = "test-only-secret-with-at-least-32-characters";
    await db.$connect();
  });
  beforeEach(async () => {
    await db.user.deleteMany({ where: { email: { endsWith: "@nexora.test" } } });
    await db.activationCode.deleteMany({ where: { code: { startsWith: "NX-TEST" } } });
    await db.rateLimit.deleteMany();
    state.cookies.clear();
    const user = await db.user.create({ data: { name: "Test", email: "viewer@nexora.test", username: "viewer", passwordHash: await bcrypt.hash("old-password", 4) } });
    state.userId = user.id; state.capture = `capture-${user.id}`; state.item = "monthly";
    await createSession(user.id);
  });
  afterAll(async () => {
    await db.$executeRawUnsafe('DROP TRIGGER IF EXISTS nexora_test_fail_grant ON "User"');
    await db.$executeRawUnsafe('DROP FUNCTION IF EXISTS nexora_test_fail_grant()');
    await db.user.deleteMany({ where: { email: { endsWith: "@nexora.test" } } });
    await db.title.deleteMany({ where: { slug: { startsWith: "nexora-test-" } } });
    await db.rateLimit.deleteMany();
    await db.$disconnect();
  });

  it("invalidates another device after changing a password and keeps the current device signed in", async () => {
    const old = state.cookies.get("session")!;
    const form = new FormData(); form.set("current", "old-password"); form.set("password", "new-password");
    expect(await changePassword(undefined, form)).toHaveProperty("ok");
    expect((await getUser())?.id).toBe(state.userId);
    state.cookies.set("session", old);
    expect(await getUser()).toBeNull();
  });

  it("revokes existing sessions when a reset link is used, and consumes the link once", async () => {
    const old = state.cookies.get("session")!;
    const token = await issueToken(state.userId, "RESET", 1);
    const form = new FormData(); form.set("token", token); form.set("password", "reset-password");
    await expect(resetPassword(undefined, form)).rejects.toThrow("REDIRECT:/account?reset=1");
    expect((await getUser())?.id).toBe(state.userId);
    state.cookies.set("session", old); expect(await getUser()).toBeNull();
    expect(await resetPassword(undefined, form)).toHaveProperty("error");
  });

  it("enforces persistent rate limits under concurrent requests and resets expired windows", async () => {
    const attempts = await Promise.all(Array.from({ length: 12 }, () => consumeLimit("test", "same-user", 5, 900)));
    expect(attempts.filter(Boolean)).toHaveLength(5);
    await db.rateLimit.updateMany({ data: { expiresAt: new Date(0) } });
    expect(await consumeLimit("test", "same-user", 5, 900)).toBe(true);
  });

  it("rejects passwords that exceed bcrypt’s byte limit without changing the account", async () => {
    const form = new FormData(); form.set("current", "old-password"); form.set("password", "ع".repeat(40));
    expect(await changePassword(undefined, form)).toHaveProperty("error");
    const user = await db.user.findUniqueOrThrow({ where: { id: state.userId } });
    expect(user.sessionVersion).toBe(0);
    expect(await bcrypt.compare("old-password", user.passwordHash)).toBe(true);
  });

  it("saves each of the ten preset avatars for the current user and can restore initials", async () => {
    const other = await db.user.create({ data: { name: "Other", email: "other@nexora.test", passwordHash: "unused", avatarId: "nova" } });
    for (const avatar of AVATARS) {
      const form = new FormData(); form.set("avatarId", avatar.id); form.set("userId", other.id);
      expect(await updateAvatar(undefined, form)).toHaveProperty("ok");
      expect((await db.user.findUniqueOrThrow({ where: { id: state.userId } })).avatarId).toBe(avatar.id);
      expect((await db.user.findUniqueOrThrow({ where: { id: other.id } })).avatarId).toBe("nova");
    }
    const reset = new FormData(); reset.set("avatarId", "initials");
    expect(await updateAvatar(undefined, reset)).toHaveProperty("ok");
    expect((await db.user.findUniqueOrThrow({ where: { id: state.userId } })).avatarId).toBeNull();
  });

  it("rejects arbitrary avatar identifiers and unauthenticated avatar changes", async () => {
    for (const value of ["https://example.com/avatar.png", "unknown", "", "__proto__"]) {
      const form = new FormData(); form.set("avatarId", value);
      expect(await updateAvatar(undefined, form)).toHaveProperty("error");
    }
    expect((await db.user.findUniqueOrThrow({ where: { id: state.userId } })).avatarId).toBeNull();
    state.cookies.clear();
    const form = new FormData(); form.set("avatarId", "ember");
    await expect(updateAvatar(undefined, form)).rejects.toThrow("REDIRECT:/login");
  });

  const captureRequest = () => new Request("http://localhost/api/paypal/capture", { method: "POST", body: JSON.stringify({ orderID: "ORDER123456" }), headers: { "Content-Type": "application/json" } });
  it("grants a captured payment only once even when requests race", async () => {
    const responses = await Promise.all([capture(captureRequest()), capture(captureRequest())]);
    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    const user = await db.user.findUniqueOrThrow({ where: { id: state.userId } });
    expect(user.accessUntil!.getTime() - Date.now()).toBeGreaterThan(29.99 * 86400000);
    expect(user.accessUntil!.getTime() - Date.now()).toBeLessThan(30.01 * 86400000);
    expect(await db.paymentRequest.count({ where: { userId: state.userId } })).toBe(1);
  });

  it("rolls back payment recording on a failed grant, allowing the same capture to be retried", async () => {
    await db.$executeRawUnsafe(`CREATE FUNCTION nexora_test_fail_grant() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."accessUntil" IS DISTINCT FROM OLD."accessUntil" THEN RAISE EXCEPTION 'test grant failure'; END IF; RETURN NEW; END $$`);
    await db.$executeRawUnsafe('CREATE TRIGGER nexora_test_fail_grant BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION nexora_test_fail_grant()');
    try {
      await expect(capture(captureRequest())).rejects.toThrow();
      expect(await db.paymentRequest.count({ where: { userId: state.userId } })).toBe(0);
    } finally {
      await db.$executeRawUnsafe('DROP TRIGGER nexora_test_fail_grant ON "User"');
      await db.$executeRawUnsafe('DROP FUNCTION nexora_test_fail_grant()');
    }
    expect((await capture(captureRequest())).status).toBe(200);
  });

  it("redeems a code once and approves a manual payment once", async () => {
    const code = "NX-TEST-AAAA-BBBB";
    await db.activationCode.create({ data: { code, item: "monthly" } });
    const form = new FormData(); form.set("code", code);
    const results = await Promise.all([redeemCode(undefined, form), redeemCode(undefined, form)]);
    expect(results.filter((r) => r?.ok)).toHaveLength(1);
    await db.user.update({ where: { id: state.userId }, data: { role: "ADMIN" } });
    const payment = await db.paymentRequest.create({ data: { userId: state.userId, item: "monthly", method: "test" } });
    await Promise.all([decidePayment(payment.id, true), decidePayment(payment.id, true)]);
    const user = await db.user.findUniqueOrThrow({ where: { id: state.userId } });
    expect(user.accessUntil!.getTime() - Date.now()).toBeGreaterThan(59.99 * 86400000);
    expect(user.accessUntil!.getTime() - Date.now()).toBeLessThan(60.01 * 86400000);
  });

  it("keeps saved titles private to their owner and rejects invalid progress", async () => {
    const title = await db.title.create({ data: { slug: `nexora-test-${state.userId}`, name: "Test movie", description: "Test", type: "MOVIE" } });
    await setWatchlist(title.id, true); await setWatchlist(title.id, true);
    expect(await db.watchlist.count({ where: { userId: state.userId } })).toBe(1);
    const req = (body: unknown) => new Request("http://localhost/api/progress", { method: "POST", body: JSON.stringify(body) });
    expect((await progress(req({ key: title.id, seconds: -1 }))).status).toBe(400);
    expect((await progress(req({ key: title.id, seconds: 100, completed: true }))).status).toBe(200);
    expect((await db.watchProgress.findFirstOrThrow({ where: { userId: state.userId } })).completed).toBe(true);
    const other = await db.user.create({ data: { name: "Other", email: "other@nexora.test", passwordHash: "unused" } });
    await createSession(other.id);
    await setWatchlist(title.id, false);
    expect(await db.watchlist.count({ where: { userId: state.userId } })).toBe(1);
  });
});
