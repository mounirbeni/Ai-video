import Link from "next/link";
import { getUser } from "@/lib/auth";
import { paypalLive } from "@/lib/paypal";
import DonateForm from "@/components/DonateForm";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = (await getT());
  const title = `${t("support.title")} · ${t("brand")}`;
  const description = t("support.subtitle");
  return {
    title: `${t("support.nav")} — ${t("brand")}`,
    description,
    alternates: { canonical: "/support" },
    openGraph: { type: "website", siteName: t("brand"), url: "/support", title, description, locale: t.locale === "ar" ? "ar_AR" : "en_US" },
    twitter: { card: "summary_large_image" as const, title, description },
  };
}

export default async function Support({ searchParams: searchParamsPromise }: { searchParams: Promise<{ thanks?: string }> }) {
  const searchParams = await searchParamsPromise;

  const user = await getUser();
  const t = (await getT());

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

        {paypalLive ? (
          <DonateForm signedIn={!!user} />
        ) : (
          <p className="mx-auto mt-10 max-w-xl rounded-md bg-amber-500/10 p-3 text-center text-sm text-amber-300">{t("pricing.unavailable")}</p>
        )}
        <p className="mt-6 text-center text-sm text-neutral-400">
          <Link href="/redeem" className="text-brand hover:underline">{t("pay.haveCode")}</Link>
        </p>
      </div>
    </div>
  );
}
