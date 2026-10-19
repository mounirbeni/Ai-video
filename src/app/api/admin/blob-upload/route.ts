import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getUser } from "@/lib/auth";
import { IMAGE_TYPES, VIDEO_TYPES } from "@/lib/storage";

// يصدر رموز رفع مباشر إلى Vercel Blob للمدير فقط
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getUser();
        if (user?.role !== "ADMIN") throw new Error("forbidden");
        const isVideo = pathname.startsWith("videos/");
        if (!isVideo && !pathname.startsWith("images/")) throw new Error("Invalid path");
        return {
          allowedContentTypes: Object.values(isVideo ? VIDEO_TYPES : IMAGE_TYPES),
          maximumSizeInBytes: (isVideo ? 5000 : 20) * 1024 * 1024,
          addRandomSuffix: false,
        };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 400 });
  }
}
