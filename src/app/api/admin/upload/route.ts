import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { IMAGE_DIR, IMAGE_TYPES, VIDEO_DIR, VIDEO_TYPES, safeName } from "@/lib/storage";

// رفع الملف كجسم الطلب مباشرة (بث إلى القرص دون تحميله في الذاكرة)
export async function PUT(req: Request) {
  const user = await getUser();
  if (user?.role !== "ADMIN") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind");
  const name = safeName(url.searchParams.get("name") || "file");
  const ext = path.extname(name).toLowerCase();
  const isVideo = kind === "video";
  if (!(isVideo ? VIDEO_TYPES : IMAGE_TYPES)[ext]) return NextResponse.json({ error: "نوع ملف غير مدعوم" }, { status: 400 });
  if (!req.body) return NextResponse.json({ error: "empty" }, { status: 400 });

  const dest = path.join(isVideo ? VIDEO_DIR : IMAGE_DIR, name);
  await pipeline(Readable.fromWeb(req.body as import("node:stream/web").ReadableStream), fs.createWriteStream(dest));
  return NextResponse.json({ value: isVideo ? `local:${name}` : `/api/media/${name}` });
}
