import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { isItem, ITEMS } from "@/lib/manual";
import { createOrder, paypalLive } from "@/lib/paypal";
import { getT } from "@/lib/i18n/server";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "login" }, { status: 401 });
  const { item } = await req.json().catch(() => ({}));
  if (!paypalLive || typeof item !== "string" || !isItem(item)) return NextResponse.json({ error: "bad" }, { status: 400 });
  try {
    return NextResponse.json({ id: await createOrder(user.id, item, getT()(ITEMS[item].nameKey)) });
  } catch {
    return NextResponse.json({ error: "paypal" }, { status: 502 });
  }
}
