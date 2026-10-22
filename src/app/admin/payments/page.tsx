import { db } from "@/lib/db";
import { ITEMS, isItem, methodsText, getWhatsapp } from "@/lib/manual";
import { decidePayment, generateCodes, saveMethods } from "@/app/actions/payments";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const EXAMPLE = `Virement bancaire (CIH Bank)
RIB: 000 000 0000000000000000 00
Bénéficiaire: Nom Prénom
---
CashPlus
Nom: Nom Prénom
Téléphone: 06 00 00 00 00`;

export default async function Payments() {
  const t = getT();
  const [pending, recent, codes, methods, methodsAr, whatsapp] = await Promise.all([
    db.paymentRequest.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" }, include: { user: true } }),
    db.paymentRequest.findMany({ where: { status: { not: "pending" } }, orderBy: { decidedAt: "desc" }, take: 20, include: { user: true } }),
    db.activationCode.findMany({ where: { usedById: null }, orderBy: { createdAt: "desc" }, take: 100 }),
    methodsText("en"),
    methodsText("ar"),
    getWhatsapp(),
  ]);
  const name = (item: string) => (isItem(item) ? `${t(ITEMS[item].nameKey)} · ${ITEMS[item].usd}` : item === "donation" ? t("support.donation") : item);

  return (
    <div className="space-y-12">
      <section>
        <h1 className="mb-4 text-2xl font-bold">{t("admin.pending")}</h1>
        {!pending.length && <p className="text-neutral-400">{t("admin.noPending")}</p>}
        <div className="space-y-3">
          {pending.map((p) => (
            <div key={p.id} className="card flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{p.user.name} <span className="text-neutral-400" dir="ltr">({p.user.email})</span></p>
                <p>{name(p.item)} — <span className="text-brand-cyan">{p.method}</span></p>
                <p className="text-neutral-400" dir="auto">{p.reference ?? "—"}</p>
                <p className="text-xs text-neutral-500">{p.createdAt.toLocaleString(t.locale)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.receiptKey && <a href={`/api/admin/receipt/${p.id}`} target="_blank" className="btn-ghost py-1.5">{t("admin.receipt")}</a>}
                <form action={decidePayment.bind(null, p.id, true)}><button className="btn-primary py-1.5">{t("admin.approve")}</button></form>
                <form action={decidePayment.bind(null, p.id, false)}><button className="btn-ghost py-1.5 text-red-300">{t("admin.reject")}</button></form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-bold">{t("admin.methods")}</h2>
        <p className="mb-3 text-sm text-neutral-400">{t("admin.methodsHelp")}</p>
        <form action={saveMethods} className="space-y-3">
          <label className="label">English</label>
          <textarea name="methods" defaultValue={methods} placeholder={EXAMPLE} rows={10} className="input font-mono text-sm" dir="ltr" />
          <label className="label">العربية ({t("admin.methodsArHint")})</label>
          <textarea name="methodsAr" defaultValue={methodsAr} rows={10} className="input font-mono text-sm" dir="rtl" />
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
                <div key={c.code} className="flex items-center justify-between rounded-lg border border-white/10 bg-neutral-900/70 px-3 py-2 text-sm">
                  <code className="select-all font-mono tracking-wider" dir="ltr">{c.code}</code>
                  <span className="text-xs text-neutral-400">{isItem(c.item) ? t(ITEMS[c.item].nameKey) : c.item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">{t("admin.recent")}</h2>
          <div className="divide-y divide-white/5 rounded-xl border border-white/10 text-sm">
            {recent.map((p) => (
              <div key={p.id} className="flex flex-wrap justify-between gap-2 p-3">
                <span>{p.user.name} — {name(p.item)} — {p.method}</span>
                <span className={p.status === "approved" ? "text-green-400" : "text-red-400"}>{t(`pay.status.${p.status as "approved"}`)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
