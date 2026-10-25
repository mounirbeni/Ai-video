import Link from "next/link";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const [titles, users, subs] = await Promise.all([
    db.title.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { episodes: true } } } }),
    db.user.count(),
    db.user.count({ where: { subscriptionStatus: { in: ["active", "trialing"] } } }),
  ]);
  const tr = (await getT());

  return (
    <div>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card"><p className="text-neutral-400">{tr("admin.statTitles")}</p><p className="text-3xl font-bold">{titles.length}</p></div>
        <div className="card"><p className="text-neutral-400">{tr("admin.statUsers")}</p><p className="text-3xl font-bold">{users}</p></div>
        <div className="card"><p className="text-neutral-400">{tr("admin.statSubs")}</p><p className="text-3xl font-bold text-green-400">{subs}</p></div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-neutral-400">
            <tr><th className="p-3 text-start">{tr("admin.colName")}</th><th className="p-3 text-start">{tr("admin.colType")}</th><th className="p-3 text-start">{tr("admin.colStatus")}</th><th className="p-3" /></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {titles.map((t) => (
              <tr key={t.id}>
                <td className="p-3 font-semibold">{t.name}</td>
                <td className="p-3">{t.type === "SERIES" ? tr("admin.seriesCount", { n: t._count.episodes }) : tr("type.MOVIE")}</td>
                <td className="p-3">{t.published ? tr("admin.published") : tr("admin.draft")}{t.isFree && tr("admin.free")}{t.featured && tr("admin.featured")}{t.comingSoon && tr("admin.soon")}</td>
                <td className="p-3 text-end">
                  <Link href={`/admin/${t.id}`} className="text-brand">{tr("admin.edit")}</Link>
                  <Link href={`/title/${t.slug}`} className="ms-4 text-neutral-400">{tr("admin.view")}</Link>
                </td>
              </tr>
            ))}
            {!titles.length && <tr><td colSpan={4} className="p-6 text-center text-neutral-400">{tr("admin.empty")} <Link href="/admin/new" className="text-brand">{tr("admin.addFirst")}</Link></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
