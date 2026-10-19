import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { MAX_STREAMS, claimStream, deviceId, releaseStream } from "@/lib/streams";

// نبضة أثناء التشغيل: تبقي الجهاز نشطًا، أو توقفه إن شوهد الحساب على أجهزة أكثر من المسموح
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: true });
  const device = deviceId();
  if ((await req.json().catch(() => ({}))).stop) {
    await releaseStream(user.id, device);
    return NextResponse.json({ ok: true });
  }
  const ok = await claimStream(user, device);
  return NextResponse.json(ok ? { ok } : { ok, max: MAX_STREAMS }, { status: ok ? 200 : 429 });
}
