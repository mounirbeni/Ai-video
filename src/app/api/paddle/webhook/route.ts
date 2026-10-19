import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { planForPrice, tierForPrice, verifyPaddleSignature } from "@/lib/paddle";
import { SUPPORT_TIERS } from "@/lib/plans";

type Subscription = {
  id: string;
  status: string; // active | trialing | past_due | paused | canceled
  customer_id: string;
  custom_data?: { userId?: string } | null;
  current_billing_period?: { ends_at: string } | null;
  items?: { price?: { id: string } }[];
};

type Transaction = {
  id: string;
  customer_id: string | null;
  custom_data?: { userId?: string } | null;
  items?: { price?: { id: string } }[];
};

// باقة دعم لمرة واحدة: تمدّد أيام المشاهدة وتمنح شارة الداعم. معاملات الاشتراك الشهري تُتجاهل هنا
async function grantSupport(tx: Transaction) {
  const tier = tierForPrice(tx.items?.[0]?.price?.id);
  if (!tier) return;
  const userId = tx.custom_data?.userId;
  const user = userId
    ? await db.user.findUnique({ where: { id: userId } })
    : tx.customer_id ? await db.user.findUnique({ where: { paddleCustomerId: tx.customer_id } }) : null;
  if (!user) return;
  const t = SUPPORT_TIERS[tier];
  const base = user.accessUntil && user.accessUntil > new Date() ? user.accessUntil : new Date();
  await db.$transaction(async (q) => {
    // المعرّف فريد: إن سبق تسجيل المعاملة فشلت الإضافة ولم تُمنح الأيام مرة ثانية
    const fresh = await q.support.createMany({ data: [{ id: tx.id, userId: user.id, tier, amountCents: t.cents }], skipDuplicates: true });
    if (fresh.count === 0) return;
    await q.user.update({
      where: { id: user.id },
      data: {
        accessUntil: new Date(base.getTime() + t.days * 86400000),
        supporterSince: user.supporterSince ?? new Date(),
        paddleCustomerId: user.paddleCustomerId ?? tx.customer_id ?? undefined,
      },
    });
  });
}

export async function POST(req: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 400 });

  const raw = await req.text();
  if (!verifyPaddleSignature(raw, req.headers.get("paddle-signature"), secret))
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  const event = JSON.parse(raw) as { event_type: string; data: Subscription };
  if (event.event_type === "transaction.completed") {
    await grantSupport(event.data as unknown as Transaction);
    return NextResponse.json({ received: true });
  }
  if (!event.event_type.startsWith("subscription.")) return NextResponse.json({ received: true });

  const s = event.data;
  const userId = s.custom_data?.userId;
  const where = userId ? { id: userId } : { paddleCustomerId: s.customer_id };
  const status = s.status === "paused" ? "canceled" : s.status;
  await db.user.updateMany({
    where,
    data: {
      paddleCustomerId: s.customer_id,
      subscriptionId: s.id,
      subscriptionStatus: status,
      subscriptionPlan: planForPrice(s.items?.[0]?.price?.id) ?? undefined,
      // عند الإلغاء يبقى الوصول حتى نهاية الفترة المدفوعة
      currentPeriodEnd: s.current_billing_period ? new Date(s.current_billing_period.ends_at) : status === "canceled" ? new Date() : undefined,
    },
  });
  return NextResponse.json({ received: true });
}
