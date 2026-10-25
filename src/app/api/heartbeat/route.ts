import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { claimStream, deviceId, releaseStream } from "@/lib/streams";
import { streamLimit } from "@/lib/access";

// نبضة أثناء التشغيل: تبقي الجهاز نشطًا، أو توقفه إن شوهد الحساب على أجهزة أكثر من المسموح
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: true });
  const device = await deviceId();
  if ((await req.json().catch(() => ({}))).stop) {
    await releaseStream(user.id, device);
    return NextResponse.json({ ok: true });
  }
  const ok = await claimStream(user, device);
  return NextResponse.json(ok ? { ok } : { ok, max: streamLimit(user) }, { status: ok ? 200 : 429 });
}
