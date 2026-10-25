import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "./db";

export async function consumeLimit(scope: string, identity: string, limit: number, seconds: number) {
  const key = `${scope}:${createHash("sha256").update(identity).digest("hex")}`;
  const rows = await db.$queryRaw<{ attempts: number }[]>`
    INSERT INTO "RateLimit" ("key", "attempts", "expiresAt")
    VALUES (${key}, 1, NOW() + ${seconds} * INTERVAL '1 second')
    ON CONFLICT ("key") DO UPDATE SET
      "attempts" = CASE WHEN "RateLimit"."expiresAt" <= NOW() THEN 1 ELSE "RateLimit"."attempts" + 1 END,
      "expiresAt" = CASE WHEN "RateLimit"."expiresAt" <= NOW() THEN NOW() + ${seconds} * INTERVAL '1 second' ELSE "RateLimit"."expiresAt" END
    RETURNING "attempts"`;
  return rows[0].attempts <= limit;
}

export async function authLimit(scope: string, email: string, accountLimit: number, seconds: number) {
  const h = await headers();
  // On Vercel this header is overwritten by the trusted ingress.
  const ip = (h.get(process.env.VERCEL ? "x-vercel-forwarded-for" : "x-forwarded-for") || "unknown").split(",")[0].trim();
  const [account, address] = await Promise.all([
    consumeLimit(`${scope}:account`, email.trim().toLowerCase().slice(0, 320), accountLimit, seconds),
    consumeLimit(`${scope}:ip`, ip, accountLimit * 10, seconds),
  ]);
  return account && address;
}
