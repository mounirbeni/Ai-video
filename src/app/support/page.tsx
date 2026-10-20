import Link from "next/link";
import { getUser } from "@/lib/auth";
import { SUPPORT_TIERS } from "@/lib/plans";
import { paddleCheckout, paddleEnv, supportPrice } from "@/lib/paddle";
import { getMethods } from "@/lib/manual";
import PaddleCheckout from "@/components/PaddleCheckout";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  const t = getT();
  return { title: `${t("support.nav")} — ${t("brand")}` };
}

export default async function Support({ searchParams }: { searchParams: { thanks?: string } }) {
  const user = await getUser();
  const t = getT();
  const manual = !paddleCheckout && (await getMethods()).length > 0;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(40rem_16rem_at_50%_0%,rgba(124,92,255,.25),transparent)]" />
      <div className="relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-brand-cyan">{t("support.kicker")}</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-extrabold sm:text-5xl">{t("support.title")}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-neutral-400">{t("support.subtitle")}</p>

        {searchParams.thanks && (
          <p className="mx-auto mt-6 max-w-xl rounded-md bg-green-500/10 p-3 text-center text-sm text-green-300">{t("support.thanks")}</p>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {Object.values(SUPPORT_TIERS).map((tier) => {
            const featured = tier.id === "supporter";
            const price = supportPrice(tier.id);
            const perks = [t("support.days", { days: tier.days, unit: tier.days <= 10 ? "أيام" : "يومًا" }), t("support.badge"), ...(tier.id === "producer" ? [t("support.credit")] : [])];
            return (
              <div
                key={tier.id}
                className={`card relative flex flex-col ${featured ? "border-brand-violet/60 shadow-[0_0_40px_-12px_rgba(124,92,255,.6)]" : ""}`}
              >
                {featured && (
                  <span className="absolute -top-3 start-6 rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan px-3 py-0.5 text-xs font-semibold">
                    {t("support.popular")}
                  </span>
                )}
                <h2 className="text-lg font-bold">{t(tier.nameKey)}</h2>
                <p className="mt-3 text-4xl font-extrabold">
                  {tier.price}
                  <span className="text-sm font-normal text-neutral-400"> · {t("support.oneTime")}</span>
                </p>
                <ul className="my-6 space-y-2 text-sm text-neutral-300">
                  {perks.map((p) => (
                    <li key={p} className="flex gap-2"><span className="text-brand-cyan">✦</span>{p}</li>
                  ))}
                </ul>
                <div className="mt-auto">
                  {manual ? (
                    <Link href={user ? `/pay?item=${tier.id}` : `/login?next=/pay?item=${tier.id}`} className={featured ? "btn-primary w-full" : "btn-ghost w-full"}>
                      {user ? t("support.cta", { price: tier.price }) : t("support.signIn")}
                    </Link>
                  ) : !paddleCheckout || !price ? (
                    <button disabled className="btn-ghost w-full cursor-not-allowed opacity-60">{t("pricing.soon")}</button>
                  ) : user ? (
                    <PaddleCheckout
                      priceId={price}
                      token={process.env.PADDLE_CLIENT_TOKEN!}
                      env={paddleEnv}
                      email={user.email}
                      userId={user.id}
                      label={t("support.cta", { price: tier.price })}
                      successPath="/support?thanks=1"
                      className={featured ? "btn-primary w-full" : "btn-ghost w-full"}
                    />
                  ) : (
                    <Link href="/login?next=/support" className={featured ? "btn-primary w-full" : "btn-ghost w-full"}>{t("support.signIn")}</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-center text-xs text-neutral-500">{t("support.note")}</p>
      </div>
    </div>
  );
}
