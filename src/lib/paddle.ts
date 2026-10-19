import crypto from "node:crypto";
import { PLANS, type PlanId } from "./plans";

// Paddle Billing — بائع رسمي (Merchant of Record) يدعم البائعين من المغرب
export const paddleEnv = process.env.PADDLE_ENV === "production" ? "production" : "sandbox";
export const paddle = !!(process.env.PADDLE_API_KEY && process.env.PADDLE_CLIENT_TOKEN);
const API = paddleEnv === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";

export function paddlePrice(plan: PlanId) {
  return process.env[PLANS[plan].paddlePriceEnv] || null;
}

export function planForPrice(priceId?: string): PlanId | undefined {
  return (Object.keys(PLANS) as PlanId[]).find((p) => paddlePrice(p) === priceId);
}

export async function paddleApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.PADDLE_API_KEY}`, "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`Paddle ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { data: T }).data;
}

// ترويسة Paddle-Signature: "ts=...;h1=..." حيث h1 = HMAC-SHA256(secret, `${ts}:${body}`)
export function verifyPaddleSignature(raw: string, header: string | null, secret: string, toleranceSec = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(";").map((kv) => kv.split("=") as [string, string]));
  const ts = Number(parts.ts);
  if (!ts || !parts.h1 || Math.abs(Date.now() / 1000 - ts) > toleranceSec) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${ts}:${raw}`).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(parts.h1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
