import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

async function syncSubscription(sub: Stripe.Subscription) {
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  // يختلف موضع الحقل بين إصدارات Stripe API (الاشتراك أو عنصره)
  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
    ?? (sub.items.data[0] as unknown as { current_period_end?: number } | undefined)?.current_period_end;
  await db.user.updateMany({
    where: { OR: [{ stripeCustomerId: customer }, ...(sub.metadata.userId ? [{ id: sub.metadata.userId }] : [])] },
    data: {
      stripeCustomerId: customer,
      subscriptionId: sub.id,
      subscriptionStatus: sub.status,
      subscriptionPlan: sub.metadata.plan ?? undefined,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
}

export async function POST(req: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "not configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      if (s.subscription) await syncSubscription(await stripe.subscriptions.retrieve(String(s.subscription)));
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      break;
  }
  return NextResponse.json({ received: true });
}
