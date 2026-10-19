"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useT } from "@/lib/i18n/client";

export default function LangSwitch({ className = "", short = false }: { className?: string; short?: boolean }) {
  const t = useT();
  const path = usePathname();
  const qs = useSearchParams().toString();
  const next = encodeURIComponent(path + (qs ? `?${qs}` : ""));
  return (
    <a href={`/lang?l=${t.locale === "ar" ? "en" : "ar"}&next=${next}`} className={className} lang={t.locale === "ar" ? "en" : "ar"} aria-label={t("lang.switch")}>
      {short ? (
        <>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
          </svg>
          <span>{t.locale === "ar" ? "EN" : "AR"}</span>
        </>
      ) : (
        t("lang.switch")
      )}
    </a>
  );
}
