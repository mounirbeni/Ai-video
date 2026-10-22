import { ITEMS, type ItemId } from "./manual";

// دفع PayPal مباشر (Orders v2): المشترك يرى اسم المتجر فقط، ويُفعَّل الوصول فور الالتقاط
export const paypalLive = !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET);
const API = process.env.PAYPAL_ENV === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

export const usdValue = (item: ItemId) => Number(ITEMS[item].usd.replace(/[^\d.]/g, "")).toFixed(2);

async function accessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64");
  const res = await fetch(`${API}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`paypal auth ${res.status}`);
  return (await res.json()).access_token as string;
}

async function call(path: string, method: "GET" | "POST", body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

export async function createOrder(userId: string, item: ItemId, name: string) {
  const { ok, data } = await call("/v2/checkout/orders", "POST", {
    intent: "CAPTURE",
    purchase_units: [{
      custom_id: `${userId}:${item}`,
      description: `Nexora — ${name}`.slice(0, 127),
      amount: { currency_code: "USD", value: usdValue(item) },
    }],
    application_context: { brand_name: "Nexora", shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW" },
  });
  if (!ok || !data.id) throw new Error("paypal order failed");
  return data.id as string;
}

type Capture = { id: string; status: string; custom_id?: string; amount: { value: string; currency_code: string } };

// يلتقط الطلب؛ إن كان ملتقطًا من قبل نقرأ حالته (إعادة المحاولة بعد انقطاع)
export async function captureOrder(orderId: string): Promise<Capture | null> {
  const id = encodeURIComponent(orderId);
  let { ok, data } = await call(`/v2/checkout/orders/${id}/capture`, "POST", {});
  if (!ok) ({ ok, data } = await call(`/v2/checkout/orders/${id}`, "GET"));
  if (!ok || data.status !== "COMPLETED") return null;
  const unit = data.purchase_units?.[0];
  const cap = unit?.payments?.captures?.[0];
  if (!cap || cap.status !== "COMPLETED") return null;
  return { ...cap, custom_id: cap.custom_id ?? unit.custom_id };
}
