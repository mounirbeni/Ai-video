"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { transaction } from "@/lib/transaction";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { grantItem, isItem, ITEMS, newCode, normalizeCode } from "@/lib/manual";
import { getT } from "@/lib/i18n/server";
import type { FormState } from "./auth";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function redeemCode(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/redeem");
  const t = (await getT());
  const code = normalizeCode(str(f, "code"));
  if (!code) return { error: t("pay.invalidCode") };
  // الشرط usedById: null داخل التحديث يمنع استخدام الكود مرتين حتى مع طلبين متزامنين
  const redeemed = await transaction(async (q) => {
    const row = await q.activationCode.findUnique({ where: { code } });
    if (!row || row.usedById || !isItem(row.item)) return null;
    const claimed = await q.activationCode.updateMany({ where: { code, usedById: null }, data: { usedById: user.id, usedAt: new Date() } });
    if (!claimed.count) return null;
    await grantItem(user.id, row.item, q);
    return row.item;
  });
  if (!redeemed) return { error: t("pay.invalidCode") };
  revalidatePath("/account");
  return { ok: t("pay.redeemed", { days: ITEMS[redeemed].days }) };
}

export async function saveWhatsapp(f: FormData) {
  await requireAdmin();
  const whatsapp = str(f, "whatsapp").replace(/\D/g, "").slice(0, 20);
  await db.setting.upsert({ where: { key: "whatsapp" }, create: { key: "whatsapp", value: whatsapp }, update: { value: whatsapp } });
  revalidatePath("/admin/payments");
  revalidatePath("/account");
}

export async function generateCodes(f: FormData) {
  await requireAdmin();
  const item = str(f, "item");
  // يقبل الأرقام العربية (٠-٩) والفارسية (۰-۹) من لوحات المفاتيح العربية
  const digits = str(f, "count").replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0));
  const count = Math.min(Math.max(parseInt(digits) || 1, 1), 50);
  if (!isItem(item)) return;
  await db.activationCode.createMany({ data: Array.from({ length: count }, () => ({ code: newCode(), item })) });
  redirect("/admin/payments#codes");
}
