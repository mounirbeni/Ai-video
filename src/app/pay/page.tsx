import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMethods, getWhatsapp, isItem, ITEMS, waLink } from "@/lib/manual";
import { submitPayment } from "@/app/actions/payments";
import PayForm from "@/components/PayForm";
import PayPalButtons from "@/components/PayPalButtons";
import { centsToUsd, donationCents, paypalLive } from "@/lib/paypal";
import { getT } from "@/lib/i18n/server";
import { CheckIcon, ClockIcon, LockIcon, ShieldIcon, SparkleIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function Pay({ searchParams }: { searchParams: { item?: string; via?: string; amount?: string } }) {
  const item = searchParams.item ?? "";
  const user = await requireUser(`/pay?item=${item}${searchParams.amount ? `&amount=${searchParams.amount}` : ""}`);
  if (item === "donation") return <Donation cents={donationCents(searchParams.amount)} />;
  if (!isItem(item)) redirect("/pricing");
  const t = getT();
  const methods = await getMethods(t.locale);
  if (!methods.length && !paypalLive) redirect("/pricing");
  const it = ITEMS[item];
  const whatsapp = await getWhatsapp();

  const perks = [
    t("support.days", { days: it.days, unit: it.days <= 10 ? "أيام" : "يومًا" }),
    ...(it.supporter ? [t("support.badge")] : []),
    ...(item === "producer" ? [t("support.credit")] : []),
    t("pay.instantDays"),
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(36rem_14rem_at_50%_0%,rgba(124,92,255,.28),transparent)]" />
      <div className="relative mx-auto max-w-md px-4 py-10">
        <Link href={it.supporter ? "/support" : "/pricing"} className="text-sm text-neutral-400 hover:text-white">{t("pay.cancel")}</Link>

        {/* ملخص الطلب */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-brand-violet/40 bg-neutral-900/80 shadow-[0_0_40px_-14px_rgba(124,92,255,.7)]">
          <div className="bg-gradient-to-r from-brand-violet/30 via-brand-blue/20 to-brand-cyan/20 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
            {t("pay.summary")}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-lg font-bold">
                  {it.supporter && <SparkleIcon className="h-4 w-4 text-brand-cyan" />}
                  {t(it.nameKey)}
                </p>
                <p className="mt-0.5 font-logo text-[11px] tracking-[0.2em] text-neutral-500" dir="ltr">NEXORA</p>
              </div>
              <div className="text-end">
                <p className="text-3xl font-extrabold">{it.usd}</p>
                <p className="text-xs text-neutral-400">{t("pay.mad", { mad: it.mad })}</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm text-neutral-300">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-2"><CheckIcon className="h-4 w-4 shrink-0 text-brand-cyan" />{p}</li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-neutral-400">{t("pay.total")}</span>
              <span className="text-xl font-extrabold text-gradient">{it.usd} USD</span>
            </div>
          </div>
        </div>

        {/* الدفع */}
        {paypalLive && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/70 p-5">
            <p className="mb-4 flex items-center gap-2 font-semibold"><LockIcon className="h-4 w-4 text-brand" />{t("pay.secure")}</p>
            <PayPalButtons clientId={process.env.PAYPAL_CLIENT_ID!} item={item} />
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center text-[11px] text-neutral-400">
              <span className="flex flex-col items-center gap-1"><LockIcon className="h-4 w-4 text-brand-cyan" />{t("pay.trustSsl")}</span>
              <span className="flex flex-col items-center gap-1"><ClockIcon className="h-4 w-4 text-brand-cyan" />{t("pay.trustInstant")}</span>
              <span className="flex flex-col items-center gap-1"><ShieldIcon className="h-4 w-4 text-brand-cyan" />{t("pay.trustPrivate")}</span>
            </div>
          </div>
        )}

      {methods.length > 0 && (
      <div className="mt-8">
        {paypalLive && <p className="mb-4 text-center text-sm text-neutral-500">{t("pay.orManual")}</p>}
        <PayForm
          action={submitPayment}
          item={item}
          methods={methods}
          usd={it.usd}
          mad={it.mad}
          itemName={t(it.nameKey)}
          returnUrl={`${process.env.APP_URL || ""}/pay?item=${item}&via=paypal`}
          returned={searchParams.via === "paypal"}
        />
      </div>
      )}

      <p className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-neutral-400">
        <Link href="/redeem" className="hover:text-white">{t("pay.haveCode")}</Link>
        {whatsapp && (
          <a
            href={waLink(whatsapp, t("pay.waMsg", { usd: it.usd, mad: it.mad, item: t(it.nameKey), email: user.email }))}
            target="_blank"
            rel="noreferrer"
            className="text-[#25D366] hover:underline"
          >
            {t("pay.help")}
          </a>
        )}
      </p>
      </div>
    </div>
  );
}

// تبرع حر بالمبلغ الذي اختاره الداعم (PayPal فقط)
function Donation({ cents }: { cents: number }) {
  if (!paypalLive || !cents) redirect("/support");
  const t = getT();
  const usd = centsToUsd(cents);
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(36rem_14rem_at_50%_0%,rgba(124,92,255,.28),transparent)]" />
      <div className="relative mx-auto max-w-md px-4 py-10">
        <Link href="/support" className="text-sm text-neutral-400 hover:text-white">{t("pay.cancel")}</Link>
        <div className="mt-4 overflow-hidden rounded-2xl border border-brand-violet/40 bg-neutral-900/80 shadow-[0_0_40px_-14px_rgba(124,92,255,.7)]">
          <div className="bg-gradient-to-r from-brand-violet/30 via-brand-blue/20 to-brand-cyan/20 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
            {t("pay.summary")}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-lg font-bold"><SparkleIcon className="h-4 w-4 text-brand-cyan" />{t("support.donation")}</p>
                <p className="mt-0.5 font-logo text-[11px] tracking-[0.2em] text-neutral-500" dir="ltr">NEXORA</p>
              </div>
              <p className="text-3xl font-extrabold">${usd}</p>
            </div>
            <ul className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm text-neutral-300">
              <li className="flex items-center gap-2"><CheckIcon className="h-4 w-4 shrink-0 text-brand-cyan" />{t("support.badge")}</li>
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-neutral-400">{t("pay.total")}</span>
              <span className="text-gradient text-xl font-extrabold">${usd} USD</span>
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-neutral-900/70 p-5">
          <p className="mb-4 flex items-center gap-2 font-semibold"><LockIcon className="h-4 w-4 text-brand" />{t("pay.secure")}</p>
          <PayPalButtons clientId={process.env.PAYPAL_CLIENT_ID!} item="donation" amount={usd} />
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center text-[11px] text-neutral-400">
            <span className="flex flex-col items-center gap-1"><LockIcon className="h-4 w-4 text-brand-cyan" />{t("pay.trustSsl")}</span>
            <span className="flex flex-col items-center gap-1"><ClockIcon className="h-4 w-4 text-brand-cyan" />{t("pay.trustInstant")}</span>
            <span className="flex flex-col items-center gap-1"><ShieldIcon className="h-4 w-4 text-brand-cyan" />{t("pay.trustPrivate")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
