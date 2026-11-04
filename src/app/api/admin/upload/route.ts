import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { IMAGE_DIR, IMAGE_TYPES, VIDEO_DIR, VIDEO_TYPES, objectKey, remote, safeName } from "@/lib/storage";

function parse(req: Request) {
  const url = new URL(req.url);
  const isVideo = url.searchParams.get("kind") === "video";
  const name = safeName(url.searchParams.get("name") || "file");
  const type = (isVideo ? VIDEO_TYPES : IMAGE_TYPES)[path.extname(name).toLowerCase()];
  return { isVideo, name, type };
}

const valueFor = (isVideo: boolean, name: string) => (isVideo ? `local:${name}` : `/api/media/${name}`);

// Vercel Blob: يرفع المتصفح مباشرة إلى الحاوية (يتجاوز حد حجم الطلب على الاستضافة)
export async function POST(req: Request) {
  const user = await getUser();
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { isVideo, name, type } = parse(req);
  if (!type) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  const pathname = objectKey(isVideo ? "video" : "image", name);
  // Vercel Blob: يرفع المتصفح عبر @vercel/blob/client بعد أخذ رمز من /api/admin/blob-upload
  if (remote) return NextResponse.json({ direct: "blob", pathname, contentType: type, value: valueFor(isVideo, name) });
  return NextResponse.json({ direct: false });
}

// التخزين المحلي: رفع الملف كجسم الطلب مباشرة (بث إلى القرص دون تحميله في الذاكرة)
export async function PUT(req: Request) {
  const user = await getUser();
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (remote) return NextResponse.json({ error: "Use direct upload" }, { status: 400 });
  const { isVideo, name, type } = parse(req);
  if (!type) return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  if (!req.body) return NextResponse.json({ error: "empty" }, { status: 400 });

  const dest = path.join(isVideo ? VIDEO_DIR : IMAGE_DIR, name);
  await pipeline(Readable.fromWeb(req.body as import("node:stream/web").ReadableStream), fs.createWriteStream(dest));
  return NextResponse.json({ value: valueFor(isVideo, name) });
}
