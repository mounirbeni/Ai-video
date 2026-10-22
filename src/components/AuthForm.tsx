"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions/auth";
import { useT } from "@/lib/i18n/client";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full" disabled={pending}>{pending ? "…" : label}</button>;
}

export default function AuthForm({
  action, mode, next,
}: { action: (s: FormState, f: FormData) => Promise<FormState>; mode: "login" | "register"; next?: string }) {
  const [state, formAction] = useFormState(action, undefined);
  const t = useT();
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      {mode === "register" && (
        <div><label className="label">{t("auth.name")}</label><input name="name" className="input" required /></div>
      )}
      {mode === "register" && (
        <div>
          <label className="label">{t("auth.username")}</label>
          <input name="username" className="input" required minLength={6} maxLength={20} pattern="\p{L}{6,20}" autoComplete="username" dir="auto" />
          <p className="mt-1 text-xs text-neutral-500">{t("auth.usernameHint")}</p>
        </div>
      )}
      <div><label className="label">{t("auth.email")}</label><input name="email" type="email" className="input" required dir="ltr" /></div>
      <div><label className="label">{t("auth.password")}</label><input name="password" type="password" className="input" required minLength={mode === "register" ? 8 : undefined} dir="ltr" /></div>
      {mode === "register" && (
        <label className="flex items-start gap-2 text-sm text-neutral-300">
          <input type="checkbox" name="terms" required className="mt-1" />
          <span>{(() => { const [a, rest] = t("auth.agree").split("{terms}"); const [b, c] = rest.split("{privacy}"); return <>{a}<a href="/terms" target="_blank" className="text-brand">{t("footer.terms")}</a>{b}<a href="/privacy" target="_blank" className="text-brand">{t("footer.privacy")}</a>{c}</>; })()}</span>
        </label>
      )}
      {mode === "login" && (
        <a href="/forgot-password" className="block text-sm text-neutral-400 hover:text-white">{t("auth.forgot")}</a>
      )}
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <Submit label={mode === "login" ? t("auth.login") : t("auth.register")} />
    </form>
  );
}
