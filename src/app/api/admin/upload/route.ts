import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { IMAGE_DIR, IMAGE_TYPES, VIDEO_DIR, VIDEO_TYPES, blob, objectKey, presignPut, remote, s3, safeName } from "@/lib/storage";

function parse(req: Request) {
  const url = new URL(req.url);
  const isVideo = url.searchParams.get("kind") === "video";
  const name = safeName(url.searchParams.get("name") || "file");
  const type = (isVideo ? VIDEO_TYPES : IMAGE_TYPES)[path.extname(name).toLowerCase()];
  return { isVideo, name, type };
}

const valueFor = (isVideo: boolean, name: string) => (isVideo ? `local:${name}` : `/api/media/${name}`);

// تخزين Neon: رابط رفع موقّع يرفع إليه المتصفح مباشرة (يتجاوز حد حجم الطلب على الاستضافة)
export async function POST(req: Request) {
  const user = await getUser();
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { isVideo, name, type } = parse(req);
  if (!type) return NextResponse.json({ error: "نوع ملف غير مدعوم" }, { status: 400 });
  const pathname = objectKey(isVideo ? "video" : "image", name);
  // Vercel Blob: يرفع المتصفح عبر @vercel/blob/client بعد أخذ رمز من /api/admin/blob-upload
  if (blob) return NextResponse.json({ direct: "blob", pathname, contentType: type, value: valueFor(isVideo, name) });
  if (!s3) return NextResponse.json({ direct: false });
  const uploadUrl = await presignPut(objectKey(isVideo ? "video" : "image", name), type);
  return NextResponse.json({ direct: true, uploadUrl, contentType: type, value: valueFor(isVideo, name) });
}

// التخزين المحلي: رفع الملف كجسم الطلب مباشرة (بث إلى القرص دون تحميله في الذاكرة)
export async function PUT(req: Request) {
  const user = await getUser();
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (remote) return NextResponse.json({ error: "استخدم الرفع المباشر" }, { status: 400 });
  const { isVideo, name, type } = parse(req);
  if (!type) return NextResponse.json({ error: "نوع ملف غير مدعوم" }, { status: 400 });
  if (!req.body) return NextResponse.json({ error: "empty" }, { status: 400 });

  const dest = path.join(isVideo ? VIDEO_DIR : IMAGE_DIR, name);
  await pipeline(Readable.fromWeb(req.body as import("node:stream/web").ReadableStream), fs.createWriteStream(dest));
  return NextResponse.json({ value: valueFor(isVideo, name) });
}
