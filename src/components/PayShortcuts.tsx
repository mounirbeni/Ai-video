"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

// نسخ بضغطة واحدة
export function CopyButton({ value }: { value: string }) {
  const t = useT();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
      className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-xs text-white hover:bg-white/20"
    >
      {done ? t("pay.copied") : t("pay.copy")}
    </button>
  );
}

// يختار طريقة الدفع في النموذج وينتقل إليه
export function UseMethodButton({ name }: { name: string }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={() => {
        const s = document.querySelector<HTMLSelectElement>("select[name=method]");
        if (s) s.value = name;
        document.getElementById("confirm")?.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => document.querySelector<HTMLInputElement>("input[name=reference]")?.focus({ preventScroll: true }), 400);
      }}
      className="mt-3 text-sm font-semibold text-brand-cyan hover:underline"
    >
      {t("pay.paidWith")} →
    </button>
  );
}
