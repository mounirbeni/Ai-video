import path from "node:path";
import fs from "node:fs";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { issueSignedToken, presignUrl } from "@vercel/blob";

export const STORAGE_DIR = path.join(process.cwd(), "storage");
export const VIDEO_DIR = path.join(STORAGE_DIR, "videos");
export const IMAGE_DIR = path.join(STORAGE_DIR, "images");

// Neon Object Storage: تُحقن متغيرات AWS_* القياسية بواسطة `neon deploy` / `neon env pull`
export const BUCKET = process.env.STORAGE_BUCKET || "assets";
export const s3 = process.env.AWS_ENDPOINT_URL_S3
  ? new S3Client({ forcePathStyle: true }) // Neon يتطلب path-style
  : null;

// Vercel Blob (حاوية خاصة): يُحقن BLOB_READ_WRITE_TOKEN عند ربط الحاوية بمشروع Vercel
export const blob = !s3 && !!process.env.BLOB_READ_WRITE_TOKEN;
export const remote = !!s3 || blob;

if (!remote) {
  try {
    for (const d of [VIDEO_DIR, IMAGE_DIR]) fs.mkdirSync(d, { recursive: true });
  } catch {
    // نظام ملفات للقراءة فقط (مثل Vercel): الرفع المحلي غير متاح، يلزم تخزين Neon
  }
}

// اسم ملف آمن: يمنع الخروج من المجلد
export function safeName(name: string) {
  const base = path.basename(name).replace(/[^\w.\-]/g, "_");
  return `${Date.now()}-${base}`;
}

export function resolveIn(dir: string, name: string) {
  const p = path.join(dir, path.basename(name));
  return p.startsWith(dir) ? p : null;
}

export const objectKey = (kind: "video" | "image", name: string) => `${kind}s/${path.basename(name)}`;

export async function presignGet(key: string, expiresIn = 3600) {
  if (s3) return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
  const validUntil = Date.now() + expiresIn * 1000;
  const token = await issueSignedToken({ pathname: key, operations: ["get"], validUntil });
  return (await presignUrl(token, { operation: "get", pathname: key, validUntil, access: "private" })).presignedUrl;
}

export function presignPut(key: string, contentType: string, expiresIn = 3600) {
  return getSignedUrl(s3!, new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), { expiresIn });
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
