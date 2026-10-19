import Link from "next/link";
import { requireUser, isSubscribed } from "@/lib/auth";
import { PLANS, type PlanId } from "@/lib/plans";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  none: "غير مشترك", active: "نشط", trialing: "فترة تجريبية", past_due: "متأخر الدفع", canceled: "ملغى",
};

export default async function Account({ searchParams }: { searchParams: { success?: string } }) {
  const user = await requireUser("/account");
  const sub = isSubscribed(user);
  const plan = user.subscriptionPlan ? PLANS[user.subscriptionPlan as PlanId] : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">حسابي</h1>
      {searchParams.success && <p className="mb-6 rounded-md bg-green-500/10 p-3 text-green-300">تم تفعيل اشتراكك بنجاح، استمتع بالمشاهدة!</p>}
      <div className="card space-y-3">
        <p><span className="text-neutral-400">الاسم: </span>{user.name}</p>
        <p><span className="text-neutral-400">البريد: </span>{user.email}</p>
        <p><span className="text-neutral-400">حالة الاشتراك: </span>
          <span className={sub ? "text-green-400" : "text-yellow-400"}>{user.role === "ADMIN" ? "مدير (وصول كامل)" : STATUS[user.subscriptionStatus] ?? user.subscriptionStatus}</span>
        </p>
        {plan && <p><span className="text-neutral-400">الخطة: </span>{plan.name}</p>}
        {user.currentPeriodEnd && <p><span className="text-neutral-400">يتجدد/ينتهي في: </span>{user.currentPeriodEnd.toLocaleDateString("ar")}</p>}
        <div className="flex gap-3 pt-3">
          {!sub && <Link href="/pricing" className="btn-primary">اشترك الآن</Link>}
          {stripe && user.stripeCustomerId && (
            <form action="/api/portal" method="post"><button className="btn-ghost">إدارة الدفع والاشتراك</button></form>
          )}
        </div>
      </div>
    </div>
  );
}
