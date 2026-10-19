"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions/auth";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full" disabled={pending}>{pending ? "…" : label}</button>;
}

export default function AuthForm({
  action, mode, next,
}: { action: (s: FormState, f: FormData) => Promise<FormState>; mode: "login" | "register"; next?: string }) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      {mode === "register" && (
        <div><label className="label">الاسم</label><input name="name" className="input" required /></div>
      )}
      <div><label className="label">البريد الإلكتروني</label><input name="email" type="email" className="input" required dir="ltr" /></div>
      <div><label className="label">كلمة المرور</label><input name="password" type="password" className="input" required minLength={mode === "register" ? 8 : undefined} dir="ltr" /></div>
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <Submit label={mode === "login" ? "دخول" : "إنشاء الحساب"} />
    </form>
  );
}
