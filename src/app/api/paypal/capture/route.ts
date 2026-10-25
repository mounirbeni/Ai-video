import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { transaction } from "@/lib/transaction";
import { grantItem, isItem } from "@/lib/manual";
import { captureOrder, centsToUsd, usdValue } from "@/lib/paypal";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
  const { orderID } = await req.json().catch(() => ({}));
  if (typeof orderID !== "string" || !/^[A-Z0-9]{6,40}$/i.test(orderID)) return NextResponse.json({ error: "bad" }, { status: 400 });

  const cap = await captureOrder(orderID).catch(() => null);
  if (!cap) return NextResponse.json({ error: "not_completed" }, { status: 402 });
  const [uid, ref = ""] = (cap.custom_id ?? "").split(":");
  const paid = Number(cap.amount.value);
  if (!Number.isFinite(paid) || uid !== user.id || cap.amount.currency_code !== "USD") return NextResponse.json({ error: "mismatch" }, { status: 400 });

  // تبرع حر: شارة داعم فقط، والمبلغ يُحفظ في وصف الطريقة
  const donation = /^donation-(\d+)$/.exec(ref);
  if (donation) {
    const cents = Number(donation[1]);
    if (paid < Number(centsToUsd(cents))) return NextResponse.json({ error: "mismatch" }, { status: 400 });
    await transaction(async (q) => {
      const fresh = await q.paymentRequest.createMany({
        data: [{ id: `pp_${cap.id}`, userId: user.id, item: "donation", method: `PayPal · $${centsToUsd(cents)}`, reference: cap.id, status: "approved", decidedAt: new Date() }],
        skipDuplicates: true,
      });
      if (fresh.count) await q.user.updateMany({ where: { id: user.id, supporterSince: null }, data: { supporterSince: new Date() } });
    });
    revalidatePath("/account");
    return NextResponse.json({ ok: true });
  }

  // الطلب يخص هذا الحساب والمبلغ مطابق للسعر
  if (!isItem(ref) || paid < Number(usdValue(ref))) return NextResponse.json({ error: "mismatch" }, { status: 400 });
  // المعرّف الفريد يمنع منح الأيام مرتين لنفس عملية الدفع
  const until = await transaction(async (q) => {
    const fresh = await q.paymentRequest.createMany({
      data: [{ id: `pp_${cap.id}`, userId: user.id, item: ref, method: "PayPal", reference: cap.id, status: "approved", decidedAt: new Date() }],
      skipDuplicates: true,
    });
    return fresh.count ? grantItem(user.id, ref, q) : (await q.user.findUnique({ where: { id: user.id } }))?.accessUntil;
  });
  revalidatePath("/account");
  return NextResponse.json({ ok: true, until });
}
