import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isItem, ITEMS } from "@/lib/manual";
import { centsToUsd, createOrder, donationCents, paypalLive, usdValue } from "@/lib/paypal";
import { getT } from "@/lib/i18n/server";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
  const { item, amount } = await req.json().catch(() => ({}));
  if (!paypalLive || typeof item !== "string") return NextResponse.json({ error: "bad" }, { status: 400 });
  const t = getT();
  try {
    if (item === "donation") {
      const cents = donationCents(amount);
      if (!cents) return NextResponse.json({ error: "amount" }, { status: 400 });
      return NextResponse.json({ id: await createOrder(user.id, `donation-${cents}`, centsToUsd(cents), t("support.donation")) });
    }
    if (!isItem(item)) return NextResponse.json({ error: "bad" }, { status: 400 });
    return NextResponse.json({ id: await createOrder(user.id, item, usdValue(item), t(ITEMS[item].nameKey)) });
  } catch {
    return NextResponse.json({ error: "paypal" }, { status: 502 });
  }
}
