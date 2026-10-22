import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { grantItem, isItem } from "@/lib/manual";
import { captureOrder, usdValue } from "@/lib/paypal";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
  const { orderID } = await req.json().catch(() => ({}));
  if (typeof orderID !== "string" || !/^[A-Z0-9]{6,40}$/i.test(orderID)) return NextResponse.json({ error: "bad" }, { status: 400 });

  const cap = await captureOrder(orderID).catch(() => null);
  if (!cap) return NextResponse.json({ error: "not_completed" }, { status: 402 });
  const [uid, item] = (cap.custom_id ?? "").split(":");
  // الطلب يخص هذا الحساب والمبلغ مطابق للسعر
  if (uid !== user.id || !item || !isItem(item) || cap.amount.currency_code !== "USD" || Number(cap.amount.value) < Number(usdValue(item))) {
    return NextResponse.json({ error: "mismatch" }, { status: 400 });
  }
  // المعرّف الفريد يمنع منح الأيام مرتين لنفس عملية الدفع
  const recorded = await db.paymentRequest
    .create({ data: { id: `pp_${cap.id}`, userId: user.id, item, method: "PayPal", reference: cap.id, status: "approved", decidedAt: new Date() } })
    .catch(() => null);
  const until = recorded ? await grantItem(user.id, item) : (await db.user.findUnique({ where: { id: user.id } }))?.accessUntil;
  revalidatePath("/account");
  return NextResponse.json({ ok: true, until });
}
