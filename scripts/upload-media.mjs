// يرفع ملفات media-upload/ إلى حاوية Vercel Blob الخاصة أثناء البناء (videos/<اسم الملف>)
import fs from "node:fs";
import path from "node:path";
import { head, put } from "@vercel/blob";

const dir = path.join(process.cwd(), "media-upload");
if (!process.env.BLOB_READ_WRITE_TOKEN || !fs.existsSync(dir)) process.exit(0);

for (const name of fs.readdirSync(dir).filter((f) => f.endsWith(".mp4"))) {
  const pathname = `videos/${name}`;
  try {
    await head(pathname);
    console.log(`media: ${pathname} موجود`);
    continue;
  } catch {}
  try {
    await put(pathname, fs.createReadStream(path.join(dir, name)), {
      access: "private",
      contentType: "video/mp4",
      addRandomSuffix: false,
      multipart: true,
    });
    console.log(`media: رُفع ${pathname}`);
  } catch (e) {
    // فشل الرفع لا يوقف نشر الموقع
    console.error(`media: فشل رفع ${pathname}:`, e?.message);
  }
}
