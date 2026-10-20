"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions/auth";
import type { Method } from "@/lib/manual";
import { useT } from "@/lib/i18n/client";
import { CopyButton } from "./PayShortcuts";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full py-3.5 text-lg" disabled={pending}>{pending ? "…" : label}</button>;
}

// أرقام الحساب تُنسخ بلا مسافات لأن بعض تطبيقات البنوك ترفضها
const copyValue = (v: string) => (/^[A-Z0-9 +]+$/i.test(v) && /\d/.test(v) ? v.replace(/\s/g, "") : v);
const valueOf = (l: string) => (l.includes(":") ? l.slice(l.indexOf(":") + 1) : l).trim();
const isPaypal = (m?: Method) => !!m && /paypal/i.test(m.name);
const emailIn = (text: string) => text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0];

// «الاسم: القيمة» → زر نسخ للقيمة؛ الروابط تصبح أزرارًا
function Details({ text }: { text: string }) {
  const t = useT();
  return (
    <div className="space-y-2">
      {text.split("\n").filter(Boolean).map((l, i) => {
        const url = l.match(/https?:\/\/\S+/)?.[0];
        if (url) return <a key={i} href={url} target="_blank" rel="noreferrer" className="btn-ghost w-full">{l.replace(url, "").replace(/[:\s]+$/, "") || url} ↗</a>;
        const value = valueOf(l);
        // سطر قيمته صورة (مثل رمز QR للبنك): يُعرض مع زر حفظ لمن يدفع من نفس الهاتف
        if (/^\/\S+\.(png|jpe?g|webp)$/i.test(value)) {
          const label = l.slice(0, l.indexOf(":")).trim();
          return (
            <div key={i} className="flex flex-col items-center gap-2 pb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt={label} width={180} height={180} className="h-44 w-44 rounded-lg bg-white p-2" />
              <p className="text-center text-xs text-neutral-400">{label}</p>
              <a href={value} download className="btn-ghost py-1.5 text-sm">{t("pay.saveQr")}</a>
            </div>
          );
        }
        return (
          <div key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 break-words text-neutral-200" dir="auto">{l}</span>
            {value.length >= 4 && <CopyButton value={copyValue(value)} />}
          </div>
        );
      })}
    </div>
  );
}

export default function PayForm({
  action, item, methods, usd, mad, itemName, returnUrl, returned,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  item: string;
  methods: Method[];
  usd: string;
  mad: number;
  itemName: string;
  returnUrl: string;
  returned: boolean;
}) {
  const t = useT();
  const [state, formAction] = useFormState(action, undefined);
  const [method, setMethod] = useState(methods[0]?.name ?? "");
  const [more, setMore] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const autoSubmit = useRef(false);
  const current = methods.find((m) => m.name === method);
  const paypal = methods.find(isPaypal);
  const paypalEmail = paypal && emailIn(paypal.details);

  // تذكّر آخر طريقة دفع استخدمها العميل
  useEffect(() => {
    try {
      const saved = localStorage.getItem("payMethod");
      if (saved && methods.some((m) => m.name === saved)) setMethod(saved);
    } catch {}
  }, [methods]);
  const choose = (name: string) => {
    setMethod(name);
    try { localStorage.setItem("payMethod", name); } catch {}
  };

  // بعد العودة من PayPal: نسجّل الدفعة تلقائيًا مرة واحدة دون ضغط «لقد دفعت»
  useEffect(() => {
    if (!returned || !paypal) return;
    const key = `paypalReturn:${item}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch {}
    autoSubmit.current = true;
    setMethod(paypal.name);
  }, [returned, paypal, item]);
  // الإرسال بعد أن يُعرض اسم الطريقة في الحقل المخفي
  useEffect(() => {
    if (autoSubmit.current && isPaypal(current)) {
      autoSubmit.current = false;
      form.current?.requestSubmit();
    }
  }, [current]);

  if (state?.ok) {
    return (
      <div className="card text-center">
        <p className="text-4xl">✓</p>
        <p className="mt-3 text-green-300">{state.ok}</p>
      </div>
    );
  }

  // رابط PayPal الرسمي بالمبلغ والمستفيد جاهزين؛ يقبل البطاقة أيضًا دون حساب PayPal
  const paypalUrl = paypalEmail
    ? `https://www.paypal.com/cgi-bin/webscr?${new URLSearchParams({
        cmd: "_xclick",
        business: paypalEmail,
        item_name: `Nexora — ${itemName}`,
        amount: usd.replace(/[^\d.]/g, ""),
        currency_code: "USD",
        no_shipping: "1",
        return: returnUrl,
        cancel_return: returnUrl.replace("&via=paypal", ""),
      })}`
    : null;
  const amountText = `${mad} MAD`;
  const copyAll = current
    ? [current.name, ...current.details.split("\n").filter((l) => l && !/\.(png|jpe?g|webp)$/i.test(l.trim())), `${t("pay.amount")}: ${amountText}`].join("\n")
    : "";

  return (
    <form ref={form} action={formAction} className="space-y-5">
      <input type="hidden" name="item" value={item} />
      <input type="hidden" name="method" value={method} />

      {methods.length > 1 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {methods.map((m) => (
            <button
              key={m.name}
              type="button"
              onClick={() => choose(m.name)}
              className={`rounded-xl px-3 py-3 text-sm font-semibold ring-1 transition ${m.name === method ? "bg-brand-violet/20 text-white ring-brand-violet" : "text-neutral-300 ring-white/10 hover:ring-white/30"}`}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {isPaypal(current) && paypalUrl ? (
        <a href={paypalUrl} className="btn w-full bg-[#ffc439] py-3.5 text-lg font-bold text-[#003087] hover:brightness-105">
          {t("pay.paypalButton", { usd })}
        </a>
      ) : (
        current && (
          <div className="rounded-xl border border-white/10 bg-neutral-900/70 p-4">
            {methods.length === 1 && <p className="mb-2 font-semibold">{current.name}</p>}
            <Details text={current.details} />
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-sm">
              <span className="font-semibold text-white">{t("pay.amount")}: {amountText}</span>
              <CopyButton value={String(mad)} />
            </div>
            <div className="mt-3"><CopyAll text={copyAll} /></div>
          </div>
        )
      )}

      {isPaypal(current) && paypalUrl ? (
        <div className="space-y-2 text-center">
          <p className="text-xs text-neutral-500">{t("pay.paypalNote")}</p>
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button className="text-sm text-neutral-400 underline-offset-4 hover:underline">{t("pay.alreadyPaid")}</button>
        </div>
      ) : (
        <>
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
        </>
      )}
    </form>
  );
}

function CopyAll({ text }: { text: string }) {
  const t = useT();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
      className="btn-ghost w-full py-2 text-sm"
    >
      {done ? t("pay.copied") : t("pay.copyAll")}
    </button>
  );
}
