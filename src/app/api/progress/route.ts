import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { validProgress } from "@/lib/progress";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const input: unknown = await req.json().catch(() => null);
  if (!validProgress(input)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { key, seconds, completed = false } = input;
  const [title, episode] = await Promise.all([
    db.title.findFirst({ where: { id: key, published: true, comingSoon: false, type: "MOVIE" }, select: { id: true } }),
    db.episode.findFirst({ where: { id: key, title: { published: true, comingSoon: false } }, select: { id: true } }),
  ]);
  if (!title && !episode) return NextResponse.json({ error: "not found" }, { status: 404 });
  await db.watchProgress.upsert({
    where: { userId_key: { userId: user.id, key } },
    update: { seconds, completed }, create: { userId: user.id, key, seconds, completed },
  });
  return NextResponse.json({ ok: true });
}
