import { db } from "@/lib/db";
import { setSubscription } from "@/app/actions/admin";
import { getT } from "@/lib/i18n/server";
import { accessKind, streamLimit } from "@/lib/access";
import PlanBadge from "@/components/PlanBadge";

export const dynamic = "force-dynamic";

export default async function Users() {
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const t = (await getT());
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("admin.usersTitle")}</h1>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-neutral-400">
            <tr><th className="p-3 text-start">{t("admin.colName")}</th><th className="p-3 text-start">{t("admin.colEmail")}</th><th className="p-3 text-start">{t("admin.colPlan")}</th><th className="p-3 text-start">{t("admin.colScreens")}</th><th className="p-3 text-start">{t("admin.colSub")}</th><th className="p-3 text-start">{t("admin.colEnds")}</th><th className="p-3 text-start">{t("admin.colGrant")}</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3">{u.name}{u.role === "ADMIN" && <span className="ms-2 text-brand">{t("admin.adminTag")}</span>}</td>
                <td className="p-3" dir="ltr">{u.email}{u.username && <span className="block text-xs text-brand">@{u.username}</span>}</td>
                <td className="p-3"><PlanBadge kind={accessKind(u)} label={t(`plan.kind.${accessKind(u)}`)} /></td>
                <td className="p-3">{accessKind(u) === "admin" ? "∞" : accessKind(u) === "none" || accessKind(u) === "supporter" ? "—" : streamLimit(u)}</td>
                {u.role === "ADMIN" ? (
                  <td className="p-3 text-green-400" colSpan={3}>{t("admin.permanent")}</td>
                ) : (<>
                <td className="p-3">{u.subscriptionStatus}{u.subscriptionPlan && ` (${u.subscriptionPlan})`}</td>
                <td className="p-3">{u.currentPeriodEnd?.toLocaleDateString(t.locale) ?? "—"}</td>
                <td className="p-3">
                  <form action={setSubscription.bind(null, u.id)} className="flex gap-2">
                    <input name="days" type="number" placeholder={t("admin.days")} className="input w-36 py-1" />
                    <button className="btn-ghost py-1">{t("admin.apply")}</button>
                  </form>
                </td>
                </>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
