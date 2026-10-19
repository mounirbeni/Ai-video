import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { IMAGE_DIR, IMAGE_TYPES, objectKey, presignGet, resolveIn, s3 } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: { name: string } }) {
  if (s3) {
    const res = NextResponse.redirect(await presignGet(objectKey("image", params.name), 24 * 3600), 302);
    res.headers.set("Cache-Control", "public, max-age=3600");
    return res;
  }
  const file = resolveIn(IMAGE_DIR, params.name);
  const type = file && IMAGE_TYPES[path.extname(file).toLowerCase()];
  if (!file || !type || !fs.existsSync(file)) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(fs.readFileSync(file), {
    headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
