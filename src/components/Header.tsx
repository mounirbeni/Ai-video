import { Suspense } from "react";
import Link from "next/link";
import { getUser, isSubscribed } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { getT } from "@/lib/i18n/server";
import LangSwitch from "./LangSwitch";

export default async function Header() {
  const user = await getUser();
  const t = (await getT());
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-neutral-950/80 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:gap-6 sm:py-3">
        <Link href="/" className="flex items-center gap-2" aria-label={t("brand")}>
          <img src="/logo-mark.png" alt="" width={32} height={32} className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="text-gradient font-logo text-[14px] tracking-[0.14em] min-[380px]:text-[15px] min-[380px]:tracking-[0.18em] sm:text-lg sm:tracking-[0.2em]" dir="ltr">NEXORA</span>
        </Link>
        <nav className="hidden gap-5 text-sm text-neutral-300 sm:flex">
          <Link href="/" className="hover:text-white">{t("nav.home")}</Link>
          <Link href="/browse?type=MOVIE" className="hover:text-white">{t("nav.movies")}</Link>
          <Link href="/browse?type=SERIES" className="hover:text-white">{t("nav.series")}</Link>
          <Link href="/my-list" className="hover:text-white">{t("list.title")}</Link>
          <Link href="/pricing" className="hover:text-white">{t("nav.subscribe")}</Link>
          <Link href="/support" className="hover:text-white">{t("support.nav")}</Link>
        </nav>
        <div className="ms-auto flex items-center gap-2 text-sm sm:gap-3">
          <form action="/browse" className="hidden md:block">
            <input name="q" placeholder={t("nav.searchPlaceholder")} className="input w-48 py-1.5" />
          </form>
          <Suspense>
            <LangSwitch className="hidden text-neutral-300 hover:text-white sm:inline" />
            <LangSwitch short className="flex h-8 items-center gap-1 rounded-full border border-white/10 px-2 text-[11px] font-semibold text-neutral-300 sm:hidden" />
          </Suspense>
          {user ? (
            <>
              {user.role === "ADMIN" && <Link href="/admin" className="btn-ghost px-3 py-1.5 text-sm sm:px-5 sm:text-base">{t("nav.admin")}</Link>}
              {!isSubscribed(user) && <Link href="/pricing" className="btn-primary px-3 py-1.5 text-sm sm:px-5 sm:text-base">{t("pricing.subscribe")}</Link>}
              <Link href="/account" className="hidden hover:text-white sm:inline">{user.name}</Link>
              <form action={logout} className="hidden sm:block">
                <button className="text-neutral-400 hover:text-white">{t("nav.logout")}</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden hover:text-white sm:inline">{t("nav.login")}</Link>
              <Link href="/register" className="btn-primary px-3 py-1.5 text-sm sm:px-5 sm:text-base">{t("nav.register")}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
