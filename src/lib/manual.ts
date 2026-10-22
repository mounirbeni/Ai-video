import crypto from "node:crypto";
import { db } from "./db";

// كل ما يمكن شراؤه يدويًا: أيام وصول تُضاف إلى accessUntil (مستقلة عن اشتراك Paddle)
export const ITEMS = {
  monthly: { nameKey: "plan.monthly", usd: "$4.99", mad: 49, days: 30, supporter: false },
  yearly: { nameKey: "plan.yearly", usd: "$49.99", mad: 499, days: 365, supporter: false },
  fan: { nameKey: "support.fan", usd: "$5", mad: 50, days: 7, supporter: true },
  supporter: { nameKey: "support.supporter", usd: "$10", mad: 100, days: 30, supporter: true },
  producer: { nameKey: "support.producer", usd: "$25", mad: 250, days: 90, supporter: true },
} as const;
export type ItemId = keyof typeof ITEMS;
export const isItem = (v: string): v is ItemId => v in ITEMS;

export type Method = { name: string; details: string };

// طرق الدفع تُكتب في لوحة الإدارة: السطر الأول اسم الطريقة، وما بعده التفاصيل، و--- بين الطرق
export function parseMethods(text: string): Method[] {
  return text
    .split(/^\s*---\s*$/m)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b) => {
      const [name, ...rest] = b.split("\n");
      return { name: name.trim(), details: rest.join("\n").trim() };
    })
    .filter((m) => m.name);
}

// manualMethods بالإنجليزية (الافتراضية) و manualMethodsAr بالعربية؛ العربية تعود للإنجليزية إن كانت فارغة
export async function methodsText(lang: "en" | "ar" = "en") {
  const key = lang === "ar" ? "manualMethodsAr" : "manualMethods";
  return (await db.setting.findUnique({ where: { key } }))?.value ?? "";
}

export async function getWhatsapp() {
  const v = (await db.setting.findUnique({ where: { key: "whatsapp" } }))?.value ?? "";
  return v.replace(/\D/g, "");
}

export const waLink = (phone: string, text: string) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;

export async function getMethods(lang: "en" | "ar" = "en") {
  const own = lang === "ar" ? parseMethods(await methodsText("ar")) : [];
  return own.length ? own : parseMethods(await methodsText("en"));
}

export async function grantItem(userId: string, item: ItemId) {
  const it = ITEMS[item];
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  const base = user.accessUntil && user.accessUntil > new Date() ? user.accessUntil : new Date();
  const accessUntil = new Date(base.getTime() + it.days * 86400000);
  // الخطة السنوية النشطة لا تُخفَّض إلى شهرية عند التمديد
  const keepYearly = user.accessPlan === "yearly" && user.accessUntil && user.accessUntil > new Date();
  const accessPlan = item === "yearly" || item === "monthly" ? (keepYearly ? "yearly" : item) : undefined;
  await db.user.update({
    where: { id: userId },
    data: { accessUntil, ...(accessPlan ? { accessPlan } : {}), ...(it.supporter && !user.supporterSince ? { supporterSince: new Date() } : {}) },
  });
  return accessUntil;
}

// كود بصيغة NX-XXXX-XXXX-XXXX من حروف لا تلتبس (بلا 0/O/1/I)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newCode() {
  const bytes = crypto.randomBytes(12);
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `NX-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export const normalizeCode = (c: string) => {
  const raw = c.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^NX/, "");
  return raw.length === 12 ? `NX-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}` : "";
};
