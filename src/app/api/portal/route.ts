import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const base = process.env.APP_URL || new URL(req.url).origin;
  const user = await getUser();
  if (!user || !stripe || !user.stripeCustomerId) return NextResponse.redirect(`${base}/account`, 303);
  const portal = await stripe.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${base}/account` });
  return NextResponse.redirect(portal.url, 303);
}
