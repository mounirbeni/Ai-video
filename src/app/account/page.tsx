import Link from "next/link";
import { requireUser, isSubscribed } from "@/lib/auth";
import { PLANS, type PlanId } from "@/lib/plans";
import { stripe } from "@/lib/stripe";
import { paddle } from "@/lib/paddle";
import { logout, resendVerification } from "@/app/actions/auth";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { ITEMS, isItem } from "@/lib/manual";

export const dynamic = "force-dynamic";


export default async function Account({ searchParams }: { searchParams: { success?: string; verify?: string; sent?: string; reset?: string } }) {
  const user = await requireUser("/account");
  const sub = isSubscribed(user);
  const plan = user.subscriptionPlan ? PLANS[user.subscriptionPlan as PlanId] : null;
  const t = getT();
  const payments = await db.paymentRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 });
  const status = (s: string) => (["none", "active", "trialing", "past_due", "canceled"].includes(s) ? t(`status.${s}` as "status.none") : s);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">{t("account.title")}</h1>
      {searchParams.success && <p className="mb-6 rounded-md bg-green-500/10 p-3 text-green-300">{t("account.success")}</p>}
      {searchParams.reset && <p className="mb-6 rounded-md bg-green-500/10 p-3 text-green-300">{t("account.reset")}</p>}
      {searchParams.verify === "ok" && <p className="mb-6 rounded-md bg-green-500/10 p-3 text-green-300">{t("account.verified")}</p>}
      {searchParams.verify === "invalid" && <p className="mb-6 rounded-md bg-red-500/10 p-3 text-red-300">{t("account.verifyInvalid")}</p>}
      {!user.emailVerified && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md bg-yellow-500/10 p-3 text-yellow-300">
          <span>
            {searchParams.verify === "required" ? t("account.verifyRequired") : t("account.unverified")}
            {searchParams.sent && t("account.sent")}
          </span>
          <form action={resendVerification}><button className="btn-ghost py-1 text-sm">{t("account.resend")}</button></form>
        </div>
      )}
      <div className="card space-y-3">
        {user.supporterSince && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-violet/25 to-brand-cyan/25 px-3 py-1 text-sm text-white ring-1 ring-brand-violet/40">✦ {t("account.supporter")}</span>
        )}
        <p><span className="text-neutral-400">{t("account.name")} </span>{user.name}</p>
        <p><span className="text-neutral-400">{t("account.email")} </span>{user.email}</p>
        <p><span className="text-neutral-400">{t("account.status")} </span>
          <span className={sub ? "text-green-400" : "text-yellow-400"}>{user.role === "ADMIN" ? t("account.admin") : sub && !["active", "trialing"].includes(user.subscriptionStatus) ? t("account.supporterAccess") : status(user.subscriptionStatus)}</span>
        </p>
        {plan && <p><span className="text-neutral-400">{t("account.plan")} </span>{t(plan.nameKey)}</p>}
        {user.currentPeriodEnd && <p><span className="text-neutral-400">{t("account.renews")} </span>{user.currentPeriodEnd.toLocaleDateString(t.locale)}</p>}
        {user.accessUntil && user.accessUntil > new Date() && (
          <p><span className="text-neutral-400">{t("account.accessUntil")} </span>{user.accessUntil.toLocaleDateString(t.locale)}</p>
        )}
        <div className="flex flex-wrap gap-3 pt-3">
          {!sub && <Link href="/pricing" className="btn-primary">{t("account.subscribe")}</Link>}
          <form action={logout}><button className="btn-ghost">{t("account.logout")}</button></form>
          {((stripe && user.stripeCustomerId) || (paddle && user.paddleCustomerId)) && (
            <form action="/api/portal" method="post"><button className="btn-ghost">{t("account.manage")}</button></form>
          )}
        </div>
      </div>
      {payments.length > 0 && (
        <div className="card mt-6">
          <h2 className="mb-3 text-lg font-bold">{t("pay.history")}</h2>
          <div className="divide-y divide-white/5 text-sm">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{isItem(p.item) ? `${t(ITEMS[p.item].nameKey)} · ${ITEMS[p.item].usd}` : p.item} — {p.method}</span>
                <span className={p.status === "approved" ? "text-green-400" : p.status === "rejected" ? "text-red-400" : "text-amber-300"}>
                  {t(`pay.status.${p.status as "pending"}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/redeem" className="text-brand hover:underline">{t("pay.haveCode")}</Link>
      </p>
    </div>
  );
}
