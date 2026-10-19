import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser, isSubscribed } from "@/lib/auth";
import { claimStream, deviceId } from "@/lib/streams";
import { VIDEO_DIR, VIDEO_TYPES, objectKey, presignGet, remote, resolveIn } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: { kind: string; id: string } }) {
  let src: string | null = null;
  let free = false;

  if (params.kind === "title") {
    const t = await db.title.findUnique({ where: { id: params.id } });
    if (!t?.published) return new NextResponse("Not found", { status: 404 });
    src = t.videoSrc;
    free = t.isFree;
  } else if (params.kind === "episode") {
    const e = await db.episode.findUnique({ where: { id: params.id }, include: { title: true } });
    if (!e?.title.published) return new NextResponse("Not found", { status: 404 });
    src = e.videoSrc;
    free = e.isFree || e.title.isFree;
  }
  if (!src) return new NextResponse("Not found", { status: 404 });

  const user = await getUser();
  if (!free && !isSubscribed(user)) return new NextResponse("اشتراك مطلوب", { status: 403 });
  if (user && !(await claimStream(user, deviceId())))
    return new NextResponse("الحساب يُشاهَد على أجهزة أكثر من المسموح", { status: 429 });

  // رابط خارجي (CDN/تخزين سحابي)
  if (!src.startsWith("local:")) return NextResponse.redirect(src, 302);

  // تخزين Neon: رابط موقّع قصير العمر (يدعم Range أصلًا)
  // رابط قصير العمر؛ المشغّل يجدده تلقائيًا عند انتهائه
  if (remote) {
    const res = NextResponse.redirect(await presignGet(objectKey("video", src.slice(6)), Number(process.env.STREAM_URL_TTL || 600)), 302);
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }

  const file = resolveIn(VIDEO_DIR, src.slice(6));
  if (!file || !fs.existsSync(file)) return new NextResponse("Not found", { status: 404 });

  const size = fs.statSync(file).size;
  const type = VIDEO_TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream";
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
  };

  const range = req.headers.get("range");
  const m = range && /bytes=(\d*)-(\d*)/.exec(range);
  if (m) {
    const start = m[1] ? parseInt(m[1]) : Math.max(0, size - parseInt(m[2]));
    const end = m[1] && m[2] ? Math.min(parseInt(m[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const stream = Readable.toWeb(fs.createReadStream(file, { start, end })) as ReadableStream;
    return new NextResponse(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  const stream = Readable.toWeb(fs.createReadStream(file)) as ReadableStream;
  return new NextResponse(stream, { headers: { ...headers, "Content-Length": String(size) } });
}
