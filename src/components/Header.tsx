import Link from "next/link";
import { getUser, isSubscribed } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export default async function Header() {
  const user = await getUser();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link href="/" className="text-2xl font-extrabold text-brand">منصتي</Link>
        <nav className="hidden gap-5 text-sm text-neutral-300 sm:flex">
          <Link href="/" className="hover:text-white">الرئيسية</Link>
          <Link href="/browse?type=MOVIE" className="hover:text-white">أفلام</Link>
          <Link href="/browse?type=SERIES" className="hover:text-white">مسلسلات</Link>
          <Link href="/pricing" className="hover:text-white">الاشتراك</Link>
        </nav>
        <div className="ms-auto flex items-center gap-3 text-sm">
          <form action="/browse" className="hidden md:block">
            <input name="q" placeholder="ابحث…" className="input w-48 py-1.5" />
          </form>
          {user ? (
            <>
              {user.role === "ADMIN" && <Link href="/admin" className="btn-ghost py-1.5">لوحة التحكم</Link>}
              {!isSubscribed(user) && <Link href="/pricing" className="btn-primary py-1.5">اشترك الآن</Link>}
              <Link href="/account" className="hover:text-white">{user.name}</Link>
              <form action={logout}>
                <button className="text-neutral-400 hover:text-white">خروج</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-white">دخول</Link>
              <Link href="/register" className="btn-primary py-1.5">إنشاء حساب</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
