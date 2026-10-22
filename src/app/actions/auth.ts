"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, getUser } from "@/lib/auth";
import { issueToken, consumeToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mail";
import { getT } from "@/lib/i18n/server";

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
  const t = getT();
  const link = `${baseUrl()}/verify-email?token=${token}`;
  await sendMail(user.email, t("mail.verifySubject"), t("mail.verifyBody", { name: user.name, link }), t.dir, {
    action: { label: t("mail.verifyButton"), url: link },
    fallback: t("mail.fallback"),
    footer: t("mail.footer"),
  });
}

// 6 أحرف بالضبط (أي لغة)، بلا أرقام أو رموز
const validUsername = (u: string) => /^\p{L}{6}$/u.test(u);

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const username = String(form.get("username") || "").trim().toLowerCase();
  const t = getT();
  if (!name || !email.includes("@")) return { error: t("err.nameEmail") };
  if (!validUsername(username)) return { error: t("err.username") };
  if (password.length < 8) return { error: t("err.passwordLength") };
  if (form.get("terms") !== "on") return { error: t("err.terms") };
  if (await db.user.findUnique({ where: { email } })) return { error: t("err.emailTaken") };
  if (await db.user.findUnique({ where: { username } })) return { error: t("err.usernameTaken") };

  const user = await db.user
    .create({ data: { name, email, username, passwordHash: await bcrypt.hash(password, 10) } })
    .catch(() => null); // تسجيلان متزامنان بنفس الاسم
  if (!user) return { error: t("err.usernameTaken") };
  await sendVerification(user);
  await createSession(user.id);
  redirect(form.get("next") ? safeNext(form.get("next")) : "/pricing");
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return { error: getT()("err.badLogin") };
  await createSession(user.id);
  // الحسابات القديمة تختار اسم مستخدم أولًا
  if (!user.username) redirect(`/choose-username?next=${encodeURIComponent(safeNext(form.get("next")))}`);
  redirect(safeNext(form.get("next")));
}

export async function chooseUsername(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) redirect("/login");
  const t = getT();
  const next = safeNext(form.get("next"));
  if (user.username) redirect(next); // لا يُغيَّر بعد اختياره
  const username = String(form.get("username") || "").trim().toLowerCase();
  if (!validUsername(username)) return { error: t("err.username") };
  const done = await db.user
    .updateMany({ where: { id: user.id, username: null }, data: { username } })
    .catch(() => null);
  if (!done) return { error: t("err.usernameTaken") };
  redirect(next);
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
  const t = getT();
  if (user) {
    const token = await issueToken(user.id, "RESET", 1);
    const link = `${baseUrl()}/reset-password?token=${token}`;
    await sendMail(user.email, t("mail.resetSubject"), t("mail.resetBody", { name: user.name, link }), t.dir, {
      action: { label: t("mail.resetButton"), url: link },
      fallback: t("mail.fallback"),
      footer: t("mail.footer"),
    });
  }
  // نفس الرد دائمًا حتى لا نكشف وجود البريد
  return { ok: t("ok.resetSent") };
}

export async function resetPassword(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") || "");
  const t = getT();
  if (password.length < 8) return { error: t("err.passwordLength") };
  const userId = await consumeToken(String(form.get("token") || ""), "RESET");
  if (!userId) return { error: t("err.badLink") };
  await db.user.update({
    where: { id: userId },
    // تغيير كلمة المرور عبر البريد يثبت ملكيته أيضًا
    data: { passwordHash: await bcrypt.hash(password, 10), emailVerified: new Date() },
  });
  await createSession(userId);
  redirect("/account?reset=1");
}
