"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { HeartIcon } from "./Icons";

const PRESETS = [3, 5, 10, 25, 50, 100];

// تبرع حر: مبالغ سريعة أو أي مبلغ يكتبه الداعم
export default function DonateForm({ signedIn }: { signedIn: boolean }) {
  const t = useT();
  const [amount, setAmount] = useState("10");
  const n = Number(amount.replace(",", "."));
  const valid = Number.isFinite(n) && n >= 1 && n <= 1000;
  const value = valid ? (Math.round(n * 100) / 100).toString() : "";
  const target = `/pay?item=donation&amount=${value}`;
  const href = signedIn ? target : `/login?next=${encodeURIComponent(target)}`;

  return (
    <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-brand-violet/40 bg-neutral-900/80 p-6 shadow-[0_0_40px_-14px_rgba(124,92,255,.7)]">
      <p className="mb-3 text-sm text-neutral-400">{t("support.amountLabel")}</p>
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(String(p))}
            className={`rounded-xl py-3 text-lg font-bold ring-1 transition ${Number(amount) === p ? "bg-brand-violet/25 text-white ring-brand-violet" : "text-neutral-300 ring-white/10 hover:ring-white/30"}`}
          >
            ${p}
          </button>
        ))}
      </div>
      <label className="mt-4 block">
        <span className="label">{t("support.custom")}</span>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-neutral-400">$</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, "").slice(0, 7))}
            inputMode="decimal"
            className="input ps-7 text-lg font-semibold"
            dir="ltr"
          />
        </div>
      </label>
      {!valid && amount !== "" && <p className="mt-2 text-sm text-red-400">{t("support.amountError")}</p>}
      <a
        href={valid ? href : undefined}
        aria-disabled={!valid}
        className={`btn-primary mt-5 w-full py-3.5 text-lg ${valid ? "" : "pointer-events-none opacity-50"}`}
      >
        <HeartIcon />{valid ? t("support.continue", { amount: value }) : t("support.donation")}
      </a>
      <p className="mt-3 text-center text-xs text-neutral-500">{t("support.freeNote")}</p>
    </div>
  );
}
