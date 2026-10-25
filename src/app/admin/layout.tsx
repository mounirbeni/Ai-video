import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const t = (await getT());
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-8 flex flex-wrap gap-3 border-b border-white/10 pb-4 text-sm">
        <Link href="/admin" className="btn-ghost py-1.5">{t("admin.content")}</Link>
        <Link href="/admin/new" className="btn-ghost py-1.5">{t("admin.add")}</Link>
        <Link href="/admin/users" className="btn-ghost py-1.5">{t("admin.users")}</Link>
        <Link href="/admin/payments" className="btn-ghost py-1.5">{t("admin.payments")}</Link>
        <Link href="/admin/ledger" className="btn-ghost py-1.5">{t("admin.ledger")}</Link>
        <Link href="/admin/payments#codes" className="btn-ghost py-1.5">{t("admin.codes")}</Link>
      </nav>
      {children}
    </div>
  );
}
