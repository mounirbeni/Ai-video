import Link from "next/link";
import { requireUser, isSubscribed } from "@/lib/auth";
import { PLANS, type PlanId } from "@/lib/plans";
import { stripe } from "@/lib/stripe";
import { paddle } from "@/lib/paddle";
import { logout, resendVerification } from "@/app/actions/auth";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";


export default async function Account({ searchParams }: { searchParams: { success?: string; verify?: string; sent?: string; reset?: string } }) {
  const user = await requireUser("/account");
  const sub = isSubscribed(user);
  const plan = user.subscriptionPlan ? PLANS[user.subscriptionPlan as PlanId] : null;
  const t = getT();
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
        <p><span className="text-neutral-400">{t("account.name")} </span>{user.name}</p>
        <p><span className="text-neutral-400">{t("account.email")} </span>{user.email}</p>
        <p><span className="text-neutral-400">{t("account.status")} </span>
          <span className={sub ? "text-green-400" : "text-yellow-400"}>{user.role === "ADMIN" ? t("account.admin") : status(user.subscriptionStatus)}</span>
        </p>
        {plan && <p><span className="text-neutral-400">{t("account.plan")} </span>{t(plan.nameKey)}</p>}
        {user.currentPeriodEnd && <p><span className="text-neutral-400">{t("account.renews")} </span>{user.currentPeriodEnd.toLocaleDateString(t.locale)}</p>}
        <div className="flex gap-3 pt-3">
          {!sub && <Link href="/pricing" className="btn-primary">{t("account.subscribe")}</Link>}
          <form action={logout}><button className="btn-ghost">{t("account.logout")}</button></form>
          {((stripe && user.stripeCustomerId) || (paddle && user.paddleCustomerId)) && (
            <form action="/api/portal" method="post"><button className="btn-ghost">{t("account.manage")}</button></form>
          )}
        </div>
      </div>
    </div>
  );
}
