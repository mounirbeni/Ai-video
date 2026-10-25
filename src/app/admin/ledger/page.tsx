import Link from "next/link";
import { db } from "@/lib/db";
import { ITEMS, isItem } from "@/lib/manual";
import { accessKind } from "@/lib/access";
import PlanBadge from "@/components/PlanBadge";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

// المبلغ بالدولار: من سعر الخطة، أو من وصف طريقة التبرع «PayPal · $12.00»
const amountOf = (p: { item: string; method: string }) =>
  isItem(p.item) ? Number(ITEMS[p.item].usd.replace(/[^\d.]/g, "")) : Number(/\$([\d.]+)/.exec(p.method)?.[1] ?? 0);

export default async function Ledger({ searchParams: searchParamsPromise }: { searchParams: Promise<{ type?: string }> }) {
  const searchParams = await searchParamsPromise;

  const t = (await getT());
  const type = ["subs", "donations"].includes(searchParams.type ?? "") ? searchParams.type! : "all";
  const where = type === "donations" ? { item: "donation" } : type === "subs" ? { item: { in: ["monthly", "yearly"] } } : {};
  const [rows, approved] = await Promise.all([
    db.paymentRequest.findMany({ where, orderBy: { createdAt: "desc" }, take: 300, include: { user: true } }),
    db.paymentRequest.findMany({ where: { status: "approved" }, select: { item: true, method: true, decidedAt: true, createdAt: true } }),
  ]);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const sum = (list: typeof approved) => list.reduce((s, p) => s + amountOf(p), 0);
  const usd = (n: number) => `$${n.toFixed(2)}`;
  const stats = [
    { label: t("admin.ledgerRevenue"), value: usd(sum(approved)) },
    { label: t("admin.ledgerMonth"), value: usd(sum(approved.filter((p) => (p.decidedAt ?? p.createdAt) >= monthStart))) },
    { label: t("admin.ledgerSubsCount"), value: String(approved.filter((p) => p.item === "monthly" || p.item === "yearly").length) },
    { label: t("admin.ledgerDonationsSum"), value: usd(sum(approved.filter((p) => p.item === "donation"))) },
  ];
  const what = (item: string) => (isItem(item) ? t(ITEMS[item].nameKey) : item === "donation" ? t("support.donation") : item);
  const tabs = [
    { id: "all", label: t("admin.ledgerAll") },
    { id: "subs", label: t("admin.ledgerSubs") },
    { id: "donations", label: t("admin.ledgerDonations") },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("admin.ledgerTitle")}</h1>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-neutral-400">{s.label}</p>
            <p className="mt-1 text-2xl font-extrabold">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        {tabs.map((x) => (
          <Link key={x.id} href={x.id === "all" ? "/admin/ledger" : `/admin/ledger?type=${x.id}`} className={`rounded-full px-4 py-1.5 text-sm ring-1 ${type === x.id ? "bg-brand-violet/25 text-white ring-brand-violet" : "text-neutral-400 ring-white/10 hover:text-white"}`}>
            {x.label}
          </Link>
        ))}
      </div>
      {!rows.length ? (
        <p className="text-neutral-400">{t("admin.ledgerEmpty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-neutral-400">
              <tr>
                <th className="p-3 text-start">{t("admin.colDate")}</th>
                <th className="p-3 text-start">{t("admin.colPayer")}</th>
                <th className="p-3 text-start">{t("admin.colWhat")}</th>
                <th className="p-3 text-start">{t("admin.colAmount")}</th>
                <th className="p-3 text-start">{t("admin.colMethod")}</th>
                <th className="p-3 text-start">{t("admin.colStatus")}</th>
                <th className="p-3 text-start">{t("admin.colPlan")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap p-3 text-neutral-300">{p.createdAt.toLocaleString(t.locale, { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="p-3">
                    <p className="font-semibold">{p.user.name}</p>
                    {p.user.username && <p className="text-xs text-brand">@{p.user.username}</p>}
                    <p className="text-xs text-neutral-500" dir="ltr">{p.user.email}</p>
                  </td>
                  <td className="p-3">{what(p.item)}</td>
                  <td className="whitespace-nowrap p-3 font-semibold">{usd(amountOf(p))}</td>
                  <td className="p-3 text-neutral-300">{p.method.split(" · ")[0]}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${p.status === "approved" ? "bg-green-500/10 text-green-400" : p.status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-300"}`}>
                      {t(`pay.status.${p.status as "pending"}`)}
                    </span>
                  </td>
                  <td className="p-3"><PlanBadge kind={accessKind(p.user)} label={t(`plan.kind.${accessKind(p.user)}`)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
