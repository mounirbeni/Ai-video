import { Suspense } from "react";
import Link from "next/link";
import { getUser, isSubscribed } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { getT } from "@/lib/i18n/server";
import LangSwitch from "./LangSwitch";

export default async function Header() {
  const user = await getUser();
  const t = getT();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-neutral-950/80 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6">
        <Link href="/" className="flex items-center gap-2" aria-label={t("brand")}>
          <img src="/logo-mark.png" alt="" width={32} height={32} className="h-8 w-8" />
          <span className="text-gradient font-logo text-lg tracking-[0.2em]" dir="ltr">NEXORA</span>
        </Link>
        <nav className="hidden gap-5 text-sm text-neutral-300 sm:flex">
          <Link href="/" className="hover:text-white">{t("nav.home")}</Link>
          <Link href="/browse?type=MOVIE" className="hover:text-white">{t("nav.movies")}</Link>
          <Link href="/browse?type=SERIES" className="hover:text-white">{t("nav.series")}</Link>
          <Link href="/pricing" className="hover:text-white">{t("nav.subscribe")}</Link>
        </nav>
        <div className="ms-auto flex items-center gap-3 text-sm">
          <form action="/browse" className="hidden md:block">
            <input name="q" placeholder={t("nav.searchPlaceholder")} className="input w-48 py-1.5" />
          </form>
          <Suspense>
            <LangSwitch className="text-neutral-300 hover:text-white" />
          </Suspense>
          {user ? (
            <>
              {user.role === "ADMIN" && <Link href="/admin" className="btn-ghost py-1.5">{t("nav.admin")}</Link>}
              {!isSubscribed(user) && <Link href="/pricing" className="btn-primary py-1.5">{t("pricing.subscribe")}</Link>}
              <Link href="/account" className="hidden hover:text-white sm:inline">{user.name}</Link>
              <form action={logout} className="hidden sm:block">
                <button className="text-neutral-400 hover:text-white">{t("nav.logout")}</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden hover:text-white sm:inline">{t("nav.login")}</Link>
              <Link href="/register" className="btn-primary py-1.5">{t("nav.register")}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
