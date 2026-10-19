import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS, type PlanId } from "@/lib/plans";
import { stripe, demoPayments } from "@/lib/stripe";
import { mailConfigured } from "@/lib/mail";

export async function POST(req: Request) {
  const base = process.env.APP_URL || new URL(req.url).origin;
  const user = await getUser();
  if (!user) return NextResponse.redirect(`${base}/login?next=/pricing`, 303);

  if (mailConfigured && !user.emailVerified) return NextResponse.redirect(`${base}/account?verify=required`, 303);

  const planId = String((await req.formData()).get("plan")) as PlanId;
  const plan = PLANS[planId];
  if (!plan) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  if (!stripe) {
    if (!demoPayments) return NextResponse.redirect(`${base}/pricing?unavailable=1`, 303);
    await db.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "active",
        subscriptionPlan: plan.id,
        currentPeriodEnd: new Date(Date.now() + plan.days * 86400000),
      },
    });
    return NextResponse.redirect(`${base}/account?success=1`, 303);
  }

  const price = process.env[plan.priceEnv];
  if (!price) return NextResponse.json({ error: `Set ${plan.priceEnv}` }, { status: 500 });

  let customer = user.stripeCustomerId;
  if (!customer) {
    customer = (await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } })).id;
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer } });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    line_items: [{ price, quantity: 1 }],
    client_reference_id: user.id,
    metadata: { userId: user.id, plan: plan.id },
    subscription_data: { metadata: { userId: user.id, plan: plan.id } },
    success_url: `${base}/account?success=1`,
    cancel_url: `${base}/pricing?canceled=1`,
  });
  return NextResponse.redirect(session.url!, 303);
}
