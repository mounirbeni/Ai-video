"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { blob, IMAGE_TYPES } from "@/lib/storage";
import { getMethods, grantItem, isItem, ITEMS, newCode, normalizeCode } from "@/lib/manual";
import { getT } from "@/lib/i18n/server";
import type { FormState } from "./auth";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const site = () => process.env.APP_URL || "";

export async function submitPayment(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/pricing");
  const t = getT();
  const item = str(f, "item");
  // الطريقة المختارة قد تكون من النسخة العربية أو الإنجليزية
  const methods = [...(await getMethods("en")), ...(await getMethods("ar"))];
  const method = methods.find((m) => m.name === str(f, "method"));
  if (!isItem(item) || !method) return { error: t("pay.unavailable") };

  const reference = str(f, "reference").slice(0, 200) || null;
  const file = f.get("receipt");
  const receipt = file instanceof File && file.size > 0 ? file : null;
  if (receipt && (receipt.size > 5 * 1024 * 1024 || !Object.values(IMAGE_TYPES).includes(receipt.type))) {
    return { error: t("pay.badFile") };
  }
  // حد للطلبات المعلّقة حتى لا تُغرق لوحة الإدارة
  if ((await db.paymentRequest.count({ where: { userId: user.id, status: "pending" } })) >= 3) {
    return { error: t("pay.tooMany") };
  }

  const req = await db.paymentRequest.create({ data: { userId: user.id, item, method: method.name, reference } });
  if (receipt && blob) {
    const ext = receipt.type.split("/")[1] || "jpg";
    const key = `receipts/${req.id}.${ext}`;
    await put(key, receipt, { access: "private", contentType: receipt.type, addRandomSuffix: false });
    await db.paymentRequest.update({ where: { id: req.id }, data: { receiptKey: key } });
  }

  // تنبيه المدير بالبريد؛ فشل البريد لا يُفشل الطلب
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
  await Promise.all(
    admins.map((a) =>
      sendMail(
        a.email,
        `دفعة جديدة للتأكيد / New payment to confirm — ${ITEMS[item].usd} (${method.name})`,
        `${user.name} (${user.email}) — ${item} — ${method.name}\nرقم العملية / Reference: ${reference ?? "—"}\n\nراجعها / Review it: ${site()}/admin/payments`,
      ).catch(() => {}),
    ),
  );
  revalidatePath("/admin/payments");
  return { ok: t("pay.sent") };
}

export async function redeemCode(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser("/redeem");
  const t = getT();
  const code = normalizeCode(str(f, "code"));
  if (!code) return { error: t("pay.invalidCode") };
  // الشرط usedById: null داخل التحديث يمنع استخدام الكود مرتين حتى مع طلبين متزامنين
  const claimed = await db.activationCode.updateMany({
    where: { code, usedById: null },
    data: { usedById: user.id, usedAt: new Date() },
  });
  const row = claimed.count ? await db.activationCode.findUnique({ where: { code } }) : null;
  if (!row || !isItem(row.item)) return { error: t("pay.invalidCode") };
  await grantItem(user.id, row.item);
  revalidatePath("/account");
  return { ok: t("pay.redeemed", { days: ITEMS[row.item].days }) };
}

export async function decidePayment(id: string, approve: boolean) {
  await requireAdmin();
  // الانتقال من pending فقط: الضغط مرتين لا يمنح الأيام مرتين
  const changed = await db.paymentRequest.updateMany({
    where: { id, status: "pending" },
    data: { status: approve ? "approved" : "rejected", decidedAt: new Date() },
  });
  if (changed.count && approve) {
    const req = await db.paymentRequest.findUniqueOrThrow({ where: { id }, include: { user: true } });
    if (isItem(req.item)) {
      const until = await grantItem(req.userId, req.item);
      const t = getT();
      await sendMail(
        req.user.email,
        t("mail.paidSubject"),
        t("mail.paidBody", { name: req.user.name, date: until.toLocaleDateString(t.locale), link: `${site()}/` }),
        t.dir,
        { action: { label: t("mail.paidButton"), url: `${site()}/` }, footer: t("mail.footer") },
      ).catch(() => {});
    }
  }
  revalidatePath("/admin/payments");
}

export async function saveMethods(f: FormData) {
  await requireAdmin();
  const value = str(f, "methods").slice(0, 5000);
  const valueAr = str(f, "methodsAr").slice(0, 5000);
  await db.setting.upsert({ where: { key: "manualMethodsAr" }, create: { key: "manualMethodsAr", value: valueAr }, update: { value: valueAr } });
  const whatsapp = str(f, "whatsapp").replace(/\D/g, "").slice(0, 20);
  await db.setting.upsert({ where: { key: "manualMethods" }, create: { key: "manualMethods", value }, update: { value } });
  await db.setting.upsert({ where: { key: "whatsapp" }, create: { key: "whatsapp", value: whatsapp }, update: { value: whatsapp } });
  revalidatePath("/admin/payments");
  revalidatePath("/pricing");
  revalidatePath("/support");
}

export async function generateCodes(f: FormData) {
  await requireAdmin();
  const item = str(f, "item");
  const count = Math.min(Math.max(parseInt(str(f, "count")) || 1, 1), 50);
  if (!isItem(item)) return;
  await db.activationCode.createMany({ data: Array.from({ length: count }, () => ({ code: newCode(), item })) });
  redirect("/admin/payments#codes");
}
