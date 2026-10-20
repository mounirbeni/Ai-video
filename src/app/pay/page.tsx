import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMethods, getWhatsapp, isItem, ITEMS, waLink } from "@/lib/manual";
import { submitPayment } from "@/app/actions/payments";
import PayForm from "@/components/PayForm";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function Pay({ searchParams }: { searchParams: { item?: string } }) {
  const item = searchParams.item ?? "";
  const user = await requireUser(`/pay?item=${item}`);
  if (!isItem(item)) redirect("/pricing");
  const methods = await getMethods();
  if (!methods.length) redirect("/pricing");
  const t = getT();
  const it = ITEMS[item];
  const whatsapp = await getWhatsapp();

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="text-center">
        <p className="text-sm text-neutral-400">{t(it.nameKey)}</p>
        <p className="mt-1 text-5xl font-extrabold">{it.usd}</p>
        <p className="mt-1 text-brand-cyan">{t("pay.mad", { mad: it.mad })}</p>
      </div>

      <div className="mt-8">
        <PayForm action={submitPayment} item={item} methods={methods} />
      </div>

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
  );
}
