import { db } from "@/lib/db";
import { setSubscription } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function Users() {
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">المستخدمون والاشتراكات</h1>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-neutral-400">
            <tr><th className="p-3 text-start">الاسم</th><th className="p-3 text-start">البريد</th><th className="p-3 text-start">الاشتراك</th><th className="p-3 text-start">ينتهي</th><th className="p-3 text-start">منح/إلغاء يدوي</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3">{u.name}{u.role === "ADMIN" && <span className="ms-2 text-brand">مدير</span>}</td>
                <td className="p-3" dir="ltr">{u.email}</td>
                <td className="p-3">{u.subscriptionStatus}{u.subscriptionPlan && ` (${u.subscriptionPlan})`}</td>
                <td className="p-3">{u.currentPeriodEnd?.toLocaleDateString("ar") ?? "—"}</td>
                <td className="p-3">
                  <form action={setSubscription.bind(null, u.id)} className="flex gap-2">
                    <input name="days" type="number" placeholder="أيام (0 = إلغاء)" className="input w-36 py-1" />
                    <button className="btn-ghost py-1">تطبيق</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
