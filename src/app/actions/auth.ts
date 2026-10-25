"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession, destroySession, getUser } from "@/lib/auth";
import { issueToken, consumeToken } from "@/lib/tokens";
import { sendMail } from "@/lib/mail";
import { transaction } from "@/lib/transaction";
import { authLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";

export type FormState = { error?: string; ok?: string } | undefined;

function safeNext(v: FormDataEntryValue | null) {
  const s = String(v || "/");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

async function baseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

async function sendVerification(user: { id: string; email: string; name: string }) {
  const token = await issueToken(user.id, "VERIFY", 48);
  const t = (await getT());
  const link = `${await baseUrl()}/verify-email?token=${token}`;
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
  const t = (await getT());
  if (!(await authLimit("register", email, 5, 3600))) return { error: (await getT())("err.rateLimit") };
  if (!name || name.length > 60 || email.length > 320 || !email.includes("@")) return { error: t("err.nameEmail") };
  if (!validUsername(username)) return { error: t("err.username") };
  if (password.length < 8) return { error: t("err.passwordLength") };
  if (Buffer.byteLength(password, "utf8") > 72) return { error: t("err.passwordTooLong") };
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
  if (!(await authLimit("login", email, 10, 900))) return { error: (await getT())("err.rateLimit") };
  if (password.length > 72) return { error: (await getT())("err.badLogin") };
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return { error: (await getT())("err.badLogin") };
  await createSession(user.id);
  // الحسابات القديمة تختار اسم مستخدم أولًا
  if (!user.username) redirect(`/choose-username?next=${encodeURIComponent(safeNext(form.get("next")))}`);
  redirect(safeNext(form.get("next")));
}

export async function chooseUsername(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) redirect("/login");
  const t = (await getT());
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

export async function updateName(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) redirect("/login");
  const name = String(form.get("name") || "").trim().slice(0, 60);
  const t = (await getT());
  if (!name) return { error: t("err.nameEmail") };
  await db.user.update({ where: { id: user.id }, data: { name } });
  revalidatePath("/account");
  return { ok: t("account.nameSaved") };
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await getUser();
  if (!user) redirect("/login");
  const t = (await getT());
  if (!(await authLimit("change-password", user.email, 10, 900))) return { error: t("err.rateLimit") };
  const current = String(form.get("current") || "");
  const next = String(form.get("password") || "");
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: t("account.wrongPassword") };
  if (next.length < 8) return { error: t("err.passwordLength") };
  if (Buffer.byteLength(next, "utf8") > 72) return { error: t("err.passwordTooLong") };
  const hash = await bcrypt.hash(next, 10);
  await transaction(async (q) => {
    await q.user.update({ where: { id: user.id }, data: { passwordHash: hash, sessionVersion: { increment: 1 } } });
    await q.authToken.deleteMany({ where: { userId: user.id, type: "RESET" } });
  });
  await createSession(user.id);
  return { ok: t("account.passwordSaved") };
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function resendVerification(): Promise<void> {
  const user = await getUser();
  if (user && !user.emailVerified && await authLimit("verify", user.email, 3, 3600)) await sendVerification(user);
  redirect("/account?sent=1");
}

export async function forgotPassword(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  if (!(await authLimit("forgot", email, 3, 3600))) return { ok: (await getT())("ok.resetSent") };
  const user = await db.user.findUnique({ where: { email } });
  const t = (await getT());
  if (user) {
    const token = await issueToken(user.id, "RESET", 1);
    const link = `${await baseUrl()}/reset-password?token=${token}`;
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
  const t = (await getT());
  if (password.length < 8) return { error: t("err.passwordLength") };
  if (Buffer.byteLength(password, "utf8") > 72) return { error: t("err.passwordTooLong") };
  if (!(await authLimit("reset", String(form.get("token") || ""), 10, 900))) return { error: t("err.rateLimit") };
  const hash = await bcrypt.hash(password, 10);
  const userId = await transaction(async (q) => {
    const id = await consumeToken(String(form.get("token") || ""), "RESET", q);
    if (!id) return null;
    await q.user.update({ where: { id }, data: { passwordHash: hash, emailVerified: new Date(), sessionVersion: { increment: 1 } } });
    await q.authToken.deleteMany({ where: { userId: id, type: "RESET" } });
    return id;
  });
  if (!userId) return { error: t("err.badLink") };
  await createSession(userId);
  redirect("/account?reset=1");
}
