import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { presignGet } from "@/lib/storage";

// الإيصالات في تخزين خاص: رابط مؤقت للمدير فقط
export async function GET(_: Request, { params }: { params: { id: string } }) {
  if ((await getUser())?.role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 });
  const req = await db.paymentRequest.findUnique({ where: { id: params.id } });
  if (!req?.receiptKey) return new NextResponse("Not found", { status: 404 });
  return NextResponse.redirect(await presignGet(req.receiptKey, 300), { headers: { "Cache-Control": "private, no-store" } });
}
