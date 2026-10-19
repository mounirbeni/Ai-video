import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { key, seconds } = await req.json();
  if (typeof key !== "string" || typeof seconds !== "number") return NextResponse.json({ error: "bad request" }, { status: 400 });
  await db.watchProgress.upsert({
    where: { userId_key: { userId: user.id, key } },
    update: { seconds },
    create: { userId: user.id, key, seconds },
  });
  return NextResponse.json({ ok: true });
}
