import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { paddle, paddleApi } from "@/lib/paddle";

export async function POST(req: Request) {
  const base = process.env.APP_URL || new URL(req.url).origin;
  const user = await getUser();
  if (user && paddle && user.paddleCustomerId) {
    const s = await paddleApi<{ urls: { general: { overview: string } } }>(`/customers/${user.paddleCustomerId}/portal-sessions`, {
      method: "POST",
      body: JSON.stringify(user.subscriptionId ? { subscription_ids: [user.subscriptionId] } : {}),
    });
    return NextResponse.redirect(s.urls.general.overview, 303);
  }
  if (!user || !stripe || !user.stripeCustomerId) return NextResponse.redirect(`${base}/account`, 303);
  const portal = await stripe.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${base}/account` });
  return NextResponse.redirect(portal.url, 303);
}
