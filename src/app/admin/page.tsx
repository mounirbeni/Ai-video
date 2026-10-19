import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const [titles, users, subs] = await Promise.all([
    db.title.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { episodes: true } } } }),
    db.user.count(),
    db.user.count({ where: { subscriptionStatus: { in: ["active", "trialing"] } } }),
  ]);

  return (
    <div>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-neutral-400">الأعمال</p><p className="text-3xl font-bold">{titles.length}</p></div>
        <div className="card"><p className="text-neutral-400">المستخدمون</p><p className="text-3xl font-bold">{users}</p></div>
        <div className="card"><p className="text-neutral-400">المشتركون النشطون</p><p className="text-3xl font-bold text-green-400">{subs}</p></div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-neutral-400">
            <tr><th className="p-3 text-start">الاسم</th><th className="p-3 text-start">النوع</th><th className="p-3 text-start">الحالة</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {titles.map((t) => (
              <tr key={t.id}>
                <td className="p-3 font-semibold">{t.name}</td>
                <td className="p-3">{t.type === "SERIES" ? `مسلسل (${t._count.episodes} حلقة)` : "فيلم"}</td>
                <td className="p-3">{t.published ? "منشور" : "مسودة"}{t.isFree && " • مجاني"}{t.featured && " • مميز"}</td>
                <td className="p-3 text-end">
                  <Link href={`/admin/${t.id}`} className="text-brand">تعديل</Link>
                  <Link href={`/title/${t.slug}`} className="ms-4 text-neutral-400">عرض</Link>
                </td>
              </tr>
            ))}
            {!titles.length && <tr><td colSpan={4} className="p-6 text-center text-neutral-400">لا يوجد محتوى بعد — <Link href="/admin/new" className="text-brand">أضف أول عمل</Link></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
