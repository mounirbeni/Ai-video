"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;

function safeNext(v: FormDataEntryValue | null) {
  const s = String(v || "/");
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "");
  if (!name || !email.includes("@")) return { error: "أدخل الاسم وبريدًا صحيحًا" };
  if (password.length < 8) return { error: "كلمة المرور 8 أحرف على الأقل" };
  if (await db.user.findUnique({ where: { email } })) return { error: "البريد مسجل مسبقًا" };

  const user = await db.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  });
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
