import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-8 flex gap-3 border-b border-white/10 pb-4 text-sm">
        <Link href="/admin" className="btn-ghost py-1.5">المحتوى</Link>
        <Link href="/admin/new" className="btn-ghost py-1.5">+ إضافة عمل</Link>
        <Link href="/admin/users" className="btn-ghost py-1.5">المشتركون</Link>
      </nav>
      {children}
    </div>
  );
}
