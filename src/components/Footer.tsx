import { Suspense } from "react";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import LangSwitch from "./LangSwitch";

export default async function Footer() {
  const t = (await getT());
  const links = [
    { href: "/browse?type=MOVIE", label: t("nav.movies") },
    { href: "/browse?type=SERIES", label: t("nav.series") },
    { href: "/pricing", label: t("footer.pricing") },
    { href: "/support", label: t("support.nav") },
    { href: "/terms", label: t("footer.terms") },
    { href: "/privacy", label: t("footer.privacy") },
    { href: "/refund", label: t("footer.refund") },
  ];
  return (
    <footer className="relative mt-20 bg-neutral-950">
      {/* خط متدرّج بألوان الهوية بدل الحد الرمادي */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-violet/60 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Link href="/" className="flex items-center gap-2" aria-label={t("brand")}>
              <img src="/logo-mark.png" alt="" width={28} height={28} className="h-7 w-7" />
              <span className="text-gradient font-logo text-base tracking-[0.2em]" dir="ltr">NEXORA</span>
            </Link>
            <p className="text-xs text-neutral-500">{t("tagline")}</p>
          </div>
          <nav className="flex max-w-sm flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-neutral-400 sm:max-w-none sm:justify-end">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="transition hover:text-white">{l.label}</Link>
            ))}
          </nav>
        </div>
        <div className="mt-6 flex flex-col-reverse items-center gap-3 border-t border-white/5 pt-5 text-xs text-neutral-500 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {t("brand")}. {t("footer.rights")}</p>
          <Suspense>
            <LangSwitch className="rounded-full border border-white/10 px-3 py-1 text-neutral-300 transition hover:border-brand-violet/60 hover:text-white" />
          </Suspense>
        </div>
      </div>
    </footer>
  );
}
