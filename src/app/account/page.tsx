import Link from "next/link";
import { requireUser, isSubscribed } from "@/lib/auth";
import { PLANS, type PlanId } from "@/lib/plans";
import { stripe } from "@/lib/stripe";
import { resendVerification } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  none: "غير مشترك", active: "نشط", trialing: "فترة تجريبية", past_due: "متأخر الدفع", canceled: "ملغى",
};

export default async function Account({ searchParams }: { searchParams: { success?: string; verify?: string; sent?: string; reset?: string } }) {
  const user = await requireUser("/account");
  const sub = isSubscribed(user);
  const plan = user.subscriptionPlan ? PLANS[user.subscriptionPlan as PlanId] : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">حسابي</h1>
      {searchParams.success && <p className="mb-6 rounded-md bg-green-500/10 p-3 text-green-300">تم تفعيل اشتراكك بنجاح، استمتع بالمشاهدة!</p>}
      {searchParams.reset && <p className="mb-6 rounded-md bg-green-500/10 p-3 text-green-300">تم تغيير كلمة المرور.</p>}
      {searchParams.verify === "ok" && <p className="mb-6 rounded-md bg-green-500/10 p-3 text-green-300">تم تأكيد بريدك الإلكتروني.</p>}
      {searchParams.verify === "invalid" && <p className="mb-6 rounded-md bg-red-500/10 p-3 text-red-300">رابط التأكيد غير صالح أو منتهي.</p>}
      {!user.emailVerified && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md bg-yellow-500/10 p-3 text-yellow-300">
          <span>
            {searchParams.verify === "required" ? "أكّد بريدك الإلكتروني قبل الاشتراك." : "بريدك غير مؤكد."}
            {searchParams.sent && " أرسلنا رابط تأكيد جديدًا."}
          </span>
          <form action={resendVerification}><button className="btn-ghost py-1 text-sm">إعادة إرسال رابط التأكيد</button></form>
        </div>
      )}
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
