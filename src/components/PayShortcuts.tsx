"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { CheckIcon, CopyIcon } from "./Icons";

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

// أيقونة نسخ فقط (للقوائم المزدحمة مثل أكواد التفعيل)
export function CopyIconButton({ value }: { value: string }) {
  const t = useT();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={t("pay.copy")}
      title={t("pay.copy")}
      onClick={() => navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
      className={`shrink-0 rounded-md p-1.5 transition ${done ? "bg-green-500/15 text-green-400" : "text-neutral-400 hover:bg-white/10 hover:text-white"}`}
    >
      {done ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
    </button>
  );
}
