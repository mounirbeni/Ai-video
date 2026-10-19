import path from "node:path";
import fs from "node:fs";

export const STORAGE_DIR = path.join(process.cwd(), "storage");
export const VIDEO_DIR = path.join(STORAGE_DIR, "videos");
export const IMAGE_DIR = path.join(STORAGE_DIR, "images");

for (const d of [VIDEO_DIR, IMAGE_DIR]) fs.mkdirSync(d, { recursive: true });

// اسم ملف آمن: يمنع الخروج من المجلد
export function safeName(name: string) {
  const base = path.basename(name).replace(/[^\w.\-]/g, "_");
  return `${Date.now()}-${base}`;
}

export function resolveIn(dir: string, name: string) {
  const p = path.join(dir, path.basename(name));
  return p.startsWith(dir) ? p : null;
}

export const VIDEO_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/mp4",
  ".mkv": "video/x-matroska",
};

export const IMAGE_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};
