"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions/auth";
import type { Method } from "@/lib/manual";
import { useT } from "@/lib/i18n/client";
import { CopyButton } from "./PayShortcuts";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full py-3.5 text-lg" disabled={pending}>{pending ? "…" : label}</button>;
}

// «الاسم: القيمة» → زر نسخ للقيمة؛ الروابط تصبح أزرارًا
function Details({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {text.split("\n").filter(Boolean).map((l, i) => {
        const url = l.match(/https?:\/\/\S+/)?.[0];
        if (url) return <a key={i} href={url} target="_blank" rel="noreferrer" className="btn-ghost w-full">{l.replace(url, "").replace(/[:\s]+$/, "") || url} ↗</a>;
        const value = (l.includes(":") ? l.slice(l.indexOf(":") + 1) : l).trim();
        return (
          <div key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 break-words text-neutral-200" dir="auto">{l}</span>
            {/* أرقام الحساب تُنسخ بلا مسافات لأن بعض تطبيقات البنوك ترفضها */}
            {value.length >= 4 && <CopyButton value={/^[A-Z0-9 +]+$/i.test(value) && /\d/.test(value) ? value.replace(/\s/g, "") : value} />}
          </div>
        );
      })}
    </div>
  );
}

export default function PayForm({
  action, item, methods,
}: { action: (s: FormState, f: FormData) => Promise<FormState>; item: string; methods: Method[] }) {
  const t = useT();
  const [state, formAction] = useFormState(action, undefined);
  const [method, setMethod] = useState(methods[0]?.name ?? "");
  const [more, setMore] = useState(false);
  const current = methods.find((m) => m.name === method);

  if (state?.ok) {
    return (
      <div className="card text-center">
        <p className="text-4xl">✓</p>
        <p className="mt-3 text-green-300">{state.ok}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="item" value={item} />
      <input type="hidden" name="method" value={method} />

      {methods.length > 1 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {methods.map((m) => (
            <button
              key={m.name}
              type="button"
              onClick={() => setMethod(m.name)}
              className={`rounded-xl px-3 py-3 text-sm font-semibold ring-1 transition ${m.name === method ? "bg-brand-violet/20 text-white ring-brand-violet" : "text-neutral-300 ring-white/10 hover:ring-white/30"}`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {current?.details && (
        <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-4">
          {methods.length === 1 && <p className="mb-2 font-semibold">{current.name}</p>}
          <Details text={current.details} />
        </div>
      )}

      {more ? (
        <div className="space-y-3">
          <input name="reference" maxLength={200} placeholder={t("pay.reference")} className="input" dir="auto" />
          <input name="receipt" type="file" accept="image/jpeg,image/png,image/webp" className="input file:me-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white" />
        </div>
      ) : (
        <button type="button" onClick={() => setMore(true)} className="text-sm text-neutral-400 underline-offset-4 hover:underline">
          + {t("pay.addProof")}
        </button>
      )}

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      <Submit label={t("pay.paid")} />
    </form>
  );
}
