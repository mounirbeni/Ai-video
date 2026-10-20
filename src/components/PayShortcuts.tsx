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
