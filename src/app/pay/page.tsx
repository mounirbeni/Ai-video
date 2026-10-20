import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMethods, isItem, ITEMS } from "@/lib/manual";
import { submitPayment } from "@/app/actions/payments";
import SimpleForm from "@/components/SimpleForm";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function Pay({ searchParams }: { searchParams: { item?: string } }) {
  const item = searchParams.item ?? "";
  await requireUser(`/pay?item=${item}`);
  if (!isItem(item)) redirect("/pricing");
  const methods = await getMethods();
  if (!methods.length) redirect("/pricing");
  const t = getT();
  const it = ITEMS[item];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">{t("pay.title")}</h1>
      <div className="card mt-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-neutral-400">{t(it.nameKey)}</p>
          <p className="mt-1 text-sm text-neutral-400">{t("pay.amount")}</p>
        </div>
        <div className="text-end">
          <p className="text-3xl font-extrabold">{it.usd}</p>
          <p className="text-sm text-brand-cyan">{t("pay.mad", { mad: it.mad })}</p>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-bold">{t("pay.step1")}</h2>
      <div className="mt-4 grid gap-3">
        {methods.map((m) => (
          <div key={m.name} className="rounded-xl border border-white/10 bg-neutral-900/70 p-4">
            <p className="font-semibold">{m.name}</p>
            {m.details && <p className="mt-1 whitespace-pre-line text-sm text-neutral-300" dir="auto">{m.details}</p>}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-neutral-500">{t("pay.note")}</p>

      <h2 className="mt-10 text-lg font-bold">{t("pay.step2")}</h2>
      <div className="card mt-4">
        <SimpleForm action={submitPayment} label={t("pay.submit")}>
          <input type="hidden" name="item" value={item} />
          <div>
            <label className="label">{t("pay.method")}</label>
            <select name="method" className="input" required>
              {methods.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{t("pay.reference")}</label>
            <input name="reference" maxLength={200} className="input" dir="auto" />
          </div>
          <div>
            <label className="label">{t("pay.receipt")}</label>
            <input name="receipt" type="file" accept="image/jpeg,image/png,image/webp" className="input file:me-3 file:rounded file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-white" />
          </div>
        </SimpleForm>
      </div>

      <p className="mt-8 text-center text-sm text-neutral-400">
        <Link href="/redeem" className="text-brand hover:underline">{t("pay.haveCode")}</Link>
      </p>
    </div>
  );
}
