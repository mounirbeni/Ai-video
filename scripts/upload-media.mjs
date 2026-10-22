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

// ملفات تُجلب من رابط خارجي (remote.json: [{ name, url, sha256 }]) حين لا يمكن وضعها في المستودع
const remoteFile = path.join(dir, "remote.json");
const remote = fs.existsSync(remoteFile) ? JSON.parse(fs.readFileSync(remoteFile, "utf8")) : [];
for (const { name, url, sha256 } of remote) {
  const pathname = `videos/${name}`;
  try {
    await head(pathname);
    console.log(`media: ${pathname} موجود`);
    continue;
  } catch {}
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const sum = (await import("node:crypto")).createHash("sha256").update(buf).digest("hex");
    if (sha256 && sum !== sha256) throw new Error("sha256 mismatch");
    await put(pathname, buf, { access: "private", contentType: "video/mp4", addRandomSuffix: false, multipart: true });
    console.log(`media: رُفع ${pathname} من رابط خارجي`);
  } catch (e) {
    console.error(`media: فشل جلب ${pathname}:`, e?.message);
  }
}
