"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, getUser } from "@/lib/auth";
import { issueToken, consumeToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mail";

export type FormState = { error?: string; ok?: string } | undefined;

function safeNext(v: FormDataEntryValue | null) {
  const s = String(v || "/");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

function baseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  const h = headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

async function sendVerification(user: { id: string; email: string; name: string }) {
  const token = await issueToken(user.id, "VERIFY", 48);
  await sendMail(
    user.email,
    "تأكيد بريدك الإلكتروني — منصتي",
    `مرحبًا ${user.name}،\nاضغط الرابط لتأكيد بريدك:\n${baseUrl()}/verify-email?token=${token}\nالرابط صالح لمدة 48 ساعة.`,
  );
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  if (!name || !email.includes("@")) return { error: "أدخل الاسم وبريدًا صحيحًا" };
  if (password.length < 8) return { error: "كلمة المرور 8 أحرف على الأقل" };
  if (form.get("terms") !== "on") return { error: "يجب الموافقة على الشروط وسياسة الخصوصية" };
  if (await db.user.findUnique({ where: { email } })) return { error: "البريد مسجل مسبقًا" };

  const user = await db.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  });
  await sendVerification(user);
  await createSession(user.id);
  redirect(form.get("next") ? safeNext(form.get("next")) : "/pricing");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return { error: "البريد أو كلمة المرور غير صحيحة" };
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  destroySession();
  redirect("/");
}

export async function resendVerification(): Promise<void> {
  const user = await getUser();
  if (user && !user.emailVerified) await sendVerification(user);
  redirect("/account?sent=1");
}

export async function forgotPassword(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    const token = await issueToken(user.id, "RESET", 1);
    await sendMail(
      user.email,
      "إعادة تعيين كلمة المرور — منصتي",
      `مرحبًا ${user.name}،\nلإعادة تعيين كلمة المرور اضغط الرابط:\n${baseUrl()}/reset-password?token=${token}\nالرابط صالح لمدة ساعة. إن لم تطلب ذلك فتجاهل الرسالة.`,
    );
  }
  // نفس الرد دائمًا حتى لا نكشف وجود البريد
  return { ok: "إن كان البريد مسجلًا فستصلك رسالة بها رابط إعادة التعيين." };
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") || "");
  if (password.length < 8) return { error: "كلمة المرور 8 أحرف على الأقل" };
  const userId = await consumeToken(String(form.get("token") || ""), "RESET");
  if (!userId) return { error: "الرابط غير صالح أو منتهي الصلاحية" };
  await db.user.update({
    where: { id: userId },
    // تغيير كلمة المرور عبر البريد يثبت ملكيته أيضًا
    data: { passwordHash: await bcrypt.hash(password, 10), emailVerified: new Date() },
  });
  await createSession(userId);
  redirect("/account?reset=1");
}
