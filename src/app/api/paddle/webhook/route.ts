import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { planForPrice, verifyPaddleSignature } from "@/lib/paddle";

type Subscription = {
  id: string;
  status: string; // active | trialing | past_due | paused | canceled
  customer_id: string;
  custom_data?: { userId?: string } | null;
  current_billing_period?: { ends_at: string } | null;
  items?: { price?: { id: string } }[];
};

export async function POST(req: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 400 });

  const raw = await req.text();
  if (!verifyPaddleSignature(raw, req.headers.get("paddle-signature"), secret))
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });

  const event = JSON.parse(raw) as { event_type: string; data: Subscription };
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
