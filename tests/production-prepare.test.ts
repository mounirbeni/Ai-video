import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isProductionBuild, validateProductionEnvironment } from "../scripts/prepare-production.mjs";

const good = { DATABASE_URL: "postgresql://local/test", AUTH_SECRET: "test-only-production-key-with-32-characters", APP_URL: "https://nexora.example.com" };

it("only prepares the database for Vercel production builds", () => {
  expect(isProductionBuild({ VERCEL: "1", VERCEL_ENV: "production" })).toBe(true);
  for (const env of [{}, { VERCEL: "1", VERCEL_ENV: "preview" }, { VERCEL_ENV: "production" }, { VERCEL: "1", VERCEL_ENV: "development" }]) expect(isProductionBuild(env)).toBe(false);
});
it("validates production configuration before any database writes", () => {
  expect(() => validateProductionEnvironment(good)).not.toThrow();
  for (const missing of ["DATABASE_URL", "AUTH_SECRET", "APP_URL"]) expect(() => validateProductionEnvironment({ ...good, [missing]: "" })).toThrow();
  for (const APP_URL of ["http://nexora.example.com", "https://user:pass@nexora.example.com", "https://nexora.example.com/path", "https://nexora.example.com?q=1"]) expect(() => validateProductionEnvironment({ ...good, APP_URL })).toThrow();
});

const enabled = !!process.env.TEST_DATABASE_URL;
describe.skipIf(!enabled)("production additive SQL", () => {
  const root = new PrismaClient();
  const schemas: string[] = [];
  const clients: PrismaClient[] = [];
  async function fixture() {
    const schema = `upgrade_test_${crypto.randomUUID().replaceAll("-", "")}`;
    schemas.push(schema);
    await root.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    const url = new URL(process.env.TEST_DATABASE_URL!); url.searchParams.set("schema", schema);
    const db = new PrismaClient({ datasourceUrl: url.href }); clients.push(db);
    await db.$executeRawUnsafe('CREATE TABLE "User" ("id" TEXT PRIMARY KEY, "email" TEXT NOT NULL)');
    await db.$executeRawUnsafe('CREATE TABLE "Title" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL)');
    await db.$executeRawUnsafe('CREATE TABLE "Episode" ("id" TEXT PRIMARY KEY, "name" TEXT NOT NULL)');
    await db.$executeRawUnsafe('CREATE TABLE "WatchProgress" ("id" TEXT PRIMARY KEY, "seconds" DOUBLE PRECISION NOT NULL)');
    await db.$executeRawUnsafe(`INSERT INTO "User" VALUES ('viewer', 'kept@example.test')`);
    await db.$executeRawUnsafe(`INSERT INTO "Title" VALUES ('movie', 'Existing movie')`);
    await db.$executeRawUnsafe(`INSERT INTO "Episode" VALUES ('episode', 'Existing episode')`);
    await db.$executeRawUnsafe(`INSERT INTO "WatchProgress" VALUES ('progress', 120)`);
    return { db, url };
  }
  function prepare(url: URL, vercelEnv = "production") {
    return spawnSync(process.execPath, [fileURLToPath(new URL("../scripts/prepare-production.mjs", import.meta.url))], {
      env: { ...process.env, ...good, DATABASE_URL: url.href, VERCEL: "1", VERCEL_ENV: vercelEnv }, encoding: "utf8",
    });
  }
  afterAll(async () => {
    await Promise.all(clients.map((c) => c.$disconnect()));
    for (const schema of schemas) await root.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await root.$disconnect();
  });
  it("preserves existing rows and saved lists when production preparation is repeated", async () => {
    const { db, url } = await fixture();
    expect(prepare(url).status).toBe(0);
    expect(await db.$queryRawUnsafe('SELECT "avatarId" FROM "User"')).toEqual([{ avatarId: null }]);
    await db.$executeRawUnsafe(`UPDATE "User" SET "avatarId" = 'ember' WHERE "id" = 'viewer'`);
    await db.$executeRawUnsafe(`INSERT INTO "Watchlist" ("userId", "titleId") VALUES ('viewer', 'movie')`);
    await db.$executeRawUnsafe(`INSERT INTO "CommunityPost" ("id", "authorId", "title", "body", "updatedAt") VALUES ('kept-post', 'viewer', 'Existing draft', 'A private draft that must survive repeated builds.', NOW())`);
    expect(prepare(url).status).toBe(0);
    const users = await db.$queryRawUnsafe<{ email: string; sessionVersion: number }[]>('SELECT "email", "sessionVersion" FROM "User"');
    expect(users).toEqual([{ email: "kept@example.test", sessionVersion: 0 }]);
    expect(await db.$queryRawUnsafe('SELECT "avatarId" FROM "User"')).toEqual([{ avatarId: "ember" }]);
    expect(await db.$queryRawUnsafe('SELECT "name", "streamFormat", "subtitles" FROM "Title"')).toEqual([{ name: "Existing movie", streamFormat: "file", subtitles: [] }]);
    expect(await db.$queryRawUnsafe('SELECT "seconds", "completed" FROM "WatchProgress"')).toEqual([{ seconds: 120, completed: false }]);
    expect(await db.$queryRawUnsafe('SELECT "userId", "titleId" FROM "Watchlist"')).toEqual([{ userId: "viewer", titleId: "movie" }]);
    expect(await db.$queryRawUnsafe('SELECT "title", "published", "version" FROM "CommunityPost"')).toEqual([{ title: "Existing draft", published: false, version: 0 }]);
  }, 30000);
  it("makes no schema changes during a preview build", async () => {
    const { db, url } = await fixture();
    expect(prepare(url, "preview").status).toBe(0);
    await expect(db.$queryRawUnsafe('SELECT "sessionVersion" FROM "User"')).rejects.toThrow();
  });
  it("rolls all changes back if preparation fails halfway through", async () => {
    const { db, url } = await fixture();
    await db.$executeRawUnsafe('DROP TABLE "Title"');
    expect(prepare(url).status).not.toBe(0);
    await expect(db.$queryRawUnsafe('SELECT "sessionVersion" FROM "User"')).rejects.toThrow();
    expect(await db.$queryRawUnsafe('SELECT "email" FROM "User"')).toEqual([{ email: "kept@example.test" }]);
  }, 30000);
});
