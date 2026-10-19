"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/client";

export default function LangSwitch({ className = "" }: { className?: string }) {
  const t = useT();
  const path = usePathname();
  const qs = useSearchParams().toString();
  const next = encodeURIComponent(path + (qs ? `?${qs}` : ""));
  return (
    <a href={`/lang?l=${t.locale === "ar" ? "en" : "ar"}&next=${next}`} className={className} lang={t.locale === "ar" ? "en" : "ar"}>
      {t("lang.switch")}
    </a>
  );
}
