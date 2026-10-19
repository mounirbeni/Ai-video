import Link from "next/link";
import { getUser, isSubscribed } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { demoPayments } from "@/lib/stripe";
import { paddle, paddleEnv, paddlePrice } from "@/lib/paddle";
import PaddleCheckout from "@/components/PaddleCheckout";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";


export default async function Pricing({ searchParams }: { searchParams: { canceled?: string } }) {
  const user = await getUser();
  const subscribed = isSubscribed(user);
  const t = getT();
  const FEATURES = [t("pricing.f1"), t("pricing.f2"), t("pricing.f3"), t("pricing.f4")];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-center text-4xl font-extrabold">{t("pricing.title")}</h1>
      <p className="mt-3 text-center text-neutral-400">{t("pricing.subtitle")}</p>
      {searchParams.canceled && <p className="mt-4 text-center text-yellow-400">{t("pricing.canceled")}</p>}
      {demoPayments && (
        <p className="mx-auto mt-4 max-w-xl rounded-md bg-yellow-500/10 p-3 text-center text-sm text-yellow-300">
          {t("pricing.demo")}
        </p>
      )}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {Object.values(PLANS).map((p) => (
          <div key={p.id} className={`card flex flex-col ${p.id === "yearly" ? "border-brand" : ""}`}>
            {p.id === "yearly" && <span className="mb-2 self-start rounded bg-brand px-2 py-0.5 text-xs">{t("pricing.save")}</span>}
            <h2 className="text-xl font-bold">{t(p.nameKey)}</h2>
            <p className="mt-3 text-4xl font-extrabold">{p.price}<span className="text-base font-normal text-neutral-400"> / {t(p.periodKey)}</span></p>
            <ul className="my-6 space-y-2 text-neutral-300">
              {FEATURES.map((f) => <li key={f}>✓ {f}</li>)}
            </ul>
            <div className="mt-auto">
              {subscribed ? (
                <Link href="/account" className="btn-ghost w-full">{t("pricing.subscribed")}</Link>
              ) : user && paddle && paddlePrice(p.id) ? (
                <PaddleCheckout priceId={paddlePrice(p.id)!} token={process.env.PADDLE_CLIENT_TOKEN!} env={paddleEnv} email={user.email} userId={user.id} />
              ) : user ? (
                <form action="/api/checkout" method="post">
                  <input type="hidden" name="plan" value={p.id} />
                  <button className="btn-primary w-full">{t("pricing.subscribe")}</button>
                </form>
              ) : (
                <Link href="/register?next=/pricing" className="btn-primary w-full">{t("pricing.createToSubscribe")}</Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
