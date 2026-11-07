import { db } from "@/lib/db";
import { ITEMS, isItem, getWhatsapp } from "@/lib/manual";
import { generateCodes, saveWhatsapp } from "@/app/actions/payments";
import { getT } from "@/lib/i18n/server";
import { CopyIconButton } from "@/components/PayShortcuts";

export const dynamic = "force-dynamic";

export default async function Payments() {
  const t = (await getT());
  const [codes, whatsapp] = await Promise.all([
    db.activationCode.findMany({ where: { usedById: null }, orderBy: { createdAt: "desc" }, take: 100 }),
    getWhatsapp(),
  ]);
  const name = (item: string) => (isItem(item) ? `${t(ITEMS[item].nameKey)} · ${ITEMS[item].usd}` : item === "donation" ? t("support.donation") : item);

  return (
    <div className="space-y-12">
      <section>
        <h1 className="mb-4 text-2xl font-bold">{t("admin.payments")}</h1>
        <form action={saveWhatsapp} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">{t("admin.whatsapp")}</label>
            <input name="whatsapp" defaultValue={whatsapp} inputMode="tel" dir="ltr" className="input max-w-xs" placeholder="212600000000" />
          </div>
          <button className="btn-primary">{t("admin.save")}</button>
        </form>
      </section>

      <section id="codes" className="scroll-mt-20">
        <h2 className="mb-4 text-xl font-bold">{t("admin.codes")}</h2>
        <form action={generateCodes} className="flex flex-wrap items-end gap-3">
          <select name="item" className="input w-auto">
            {Object.keys(ITEMS).map((k) => <option key={k} value={k}>{name(k)}</option>)}
          </select>
          <div>
            <label className="label">{t("admin.count")}</label>
            <input name="count" inputMode="numeric" defaultValue={5} className="input w-24" dir="ltr" />
          </div>
          <button className="btn-primary">{t("admin.generate")}</button>
        </form>
        {codes.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-sm text-neutral-400">{t("admin.unused")} ({codes.length})</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {codes.map((c) => (
                <div key={c.code} className="flex items-center gap-2 rounded-lg border border-white/10 bg-neutral-900/70 px-3 py-2 text-sm">
                  <code className="flex-1 select-all font-mono tracking-wider" dir="ltr">{c.code}</code>
                  <span className="text-xs text-neutral-400">{isItem(c.item) ? t(ITEMS[c.item].nameKey) : c.item}</span>
                  <CopyIconButton value={c.code} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
