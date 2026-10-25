import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function isProductionBuild(env) {
  return env.VERCEL === "1" && env.VERCEL_ENV === "production";
}

export function validateProductionEnvironment(env) {
  if (!env.DATABASE_URL) throw new Error("Production requires DATABASE_URL");
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32 || env.AUTH_SECRET === "dev-secret") {
    throw new Error("Production requires an AUTH_SECRET of at least 32 characters");
  }
  let url;
  try { url = new URL(env.APP_URL); } catch { throw new Error("Production requires an HTTPS APP_URL origin"); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Production requires an HTTPS APP_URL origin");
  }
}

export function prepareProduction(env = process.env) {
  if (!isProductionBuild(env)) {
    console.log("Database preparation skipped outside Vercel production.");
    return;
  }
  validateProductionEnvironment(env);
  const root = fileURLToPath(new URL("../", import.meta.url));
  // Only the reviewed additive SQL is applied. No db push, reset, seed or content writes.
  const result = spawnSync(process.execPath, [
    resolve(root, "node_modules/prisma/build/index.js"), "db", "execute",
    "--file", resolve(root, "prisma/updates/20261025-security-library.sql"),
    "--schema", resolve(root, "prisma/schema.prisma"),
  ], { cwd: root, env, encoding: "utf8", timeout: 120000 });
  if (result.error || result.status !== 0) {
    // Do not expose datasource credentials in a failed CLI diagnostic.
    throw new Error("Production database preparation failed; the new build was stopped. Check database connectivity, permissions and the additive SQL update.");
  }
  console.log("Production database preparation completed.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { prepareProduction(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
