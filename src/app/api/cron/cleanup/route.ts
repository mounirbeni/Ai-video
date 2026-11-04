import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// مهمة دورية (Vercel Cron): تحذف عدّادات المحاولات المنتهية والأجهزة الخاملة ورموز التحقق المنتهية
export async function GET(req: Request) {
  if (!authorized(req)) return new NextResponse("Unauthorized", { status: 401 });
  const now = new Date();
  const [rateLimits, streams, tokens] = await Promise.all([
    db.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.activeStream.deleteMany({ where: { lastSeen: { lt: new Date(now.getTime() - 24 * 3600_000) } } }),
    db.authToken.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
  return NextResponse.json({ rateLimits: rateLimits.count, streams: streams.count, tokens: tokens.count });
}
