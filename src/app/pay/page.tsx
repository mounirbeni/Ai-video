import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMethods, getWhatsapp, isItem, ITEMS, waLink } from "@/lib/manual";
import { CopyButton, UseMethodButton } from "@/components/PayShortcuts";
import { submitPayment } from "@/app/actions/payments";
import SimpleForm from "@/components/SimpleForm";
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
  // تبديل سريع بين الخطط دون الرجوع لصفحة الأسعار
  const group = it.supporter ? (["fan", "supporter", "producer"] as const) : (["monthly", "yearly"] as const);
  // «الاسم: القيمة» → زر نسخ للقيمة؛ الروابط تصبح أزرارًا
  const lines = (details: string) =>
    details.split("\n").map((l) => {
      const url = l.match(/https?:\/\/\S+/)?.[0];
      const value = (l.includes(":") && !url ? l.slice(l.indexOf(":") + 1) : l).trim();
      return { text: l, value, url };
    });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">{t("pay.title")}</h1>
      <div className="mt-5 flex flex-wrap gap-2">
        {group.map((g) => (
          <Link
            key={g}
            href={`/pay?item=${g}`}
            className={`rounded-full px-4 py-1.5 text-sm ring-1 transition ${g === item ? "bg-gradient-to-r from-brand-violet to-brand-cyan text-white ring-transparent" : "text-neutral-300 ring-white/15 hover:ring-white/40"}`}
          >
            {t(ITEMS[g].nameKey)} · {ITEMS[g].usd}
          </Link>
        ))}
      </div>
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
            {m.details && (
              <div className="mt-2 space-y-1.5">
                {lines(m.details).map((l, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm text-neutral-300">
                    {l.url ? (
                      <a href={l.url} target="_blank" rel="noreferrer" className="btn-ghost py-1 text-sm">{l.text.replace(l.url, "").replace(/[:\s]+$/, "") || l.url} ↗</a>
                    ) : (
                      <>
                        <span className="min-w-0 break-words" dir="auto">{l.text}</span>
                        {l.value.length >= 4 && <CopyButton value={l.value} />}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            <UseMethodButton name={m.name} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-neutral-500">{t("pay.note")}</p>

      <h2 id="confirm" className="mt-10 scroll-mt-20 text-lg font-bold">{t("pay.step2")}</h2>
      {whatsapp && (
        <a
          href={waLink(whatsapp, t("pay.waMsg", { usd: it.usd, mad: it.mad, item: t(it.nameKey), email: user.email }))}
          target="_blank"
          rel="noreferrer"
          className="btn mt-4 w-full bg-[#25D366] text-white hover:brightness-110"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>
          {t("pay.whatsapp")}
        </a>
      )}
      {whatsapp && <p className="my-3 text-center text-xs text-neutral-500">{t("pay.or")}</p>}
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
        {whatsapp && (
          <>
            {" · "}
            <a href={waLink(whatsapp, t("pay.waCodeMsg", { email: user.email }))} target="_blank" rel="noreferrer" className="text-[#25D366] hover:underline">{t("pay.whatsappCode")}</a>
          </>
        )}
      </p>
    </div>
  );
}
