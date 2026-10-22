import Link from "next/link";
import { requireUser, isSubscribed } from "@/lib/auth";
import { PLANS, type PlanId } from "@/lib/plans";
import { stripe } from "@/lib/stripe";
import { paddle } from "@/lib/paddle";
import { changePassword, logout, resendVerification, updateName } from "@/app/actions/auth";
import { getT } from "@/lib/i18n/server";
import { localizeTitle } from "@/lib/i18n/localize";
import { db } from "@/lib/db";
import { ITEMS, isItem, getWhatsapp, waLink } from "@/lib/manual";
import { MAX_STREAMS } from "@/lib/streams";
import { contactEmail } from "@/lib/contact";
import SimpleForm from "@/components/SimpleForm";
import {
  ArrowNextIcon, CardIcon, ChatIcon, DocIcon, FilmIcon, GiftIcon, GlobeIcon, HeartIcon, KeyIcon, LogoutIcon,
  MailIcon, PlayIcon, ScreenIcon, ShieldIcon, SparkleIcon, UserIcon,
} from "@/components/Icons";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="card mt-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><span className="text-brand">{icon}</span>{title}</h2>
      {children}
    </section>
  );
}

export default async function Account({ searchParams }: { searchParams: { success?: string; verify?: string; sent?: string; reset?: string } }) {
  const user = await requireUser("/account");
  const sub = isSubscribed(user);
  const plan = user.subscriptionPlan ? PLANS[user.subscriptionPlan as PlanId] : null;
  const t = getT();
  const status = (s: string) => (["none", "active", "trialing", "past_due", "canceled"].includes(s) ? t(`status.${s}` as "status.none") : s);

  const [payments, progress, whatsapp] = await Promise.all([
    db.paymentRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    db.watchProgress.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 40 }),
    getWhatsapp(),
  ]);

  // «تابع المشاهدة»: مفتاح التقدم إما معرّف فيلم أو معرّف حلقة؛ نعرض آخر عمل واحد لكل عنوان
  const keys = progress.map((p) => p.key);
  const [titles, episodes] = await Promise.all([
    db.title.findMany({ where: { id: { in: keys }, published: true } }),
    db.episode.findMany({ where: { id: { in: keys } }, include: { title: true } }),
  ]);
  const seen = new Set<string>();
  const recent: { href: string; title: { name: string; posterUrl: string | null }; sub?: string }[] = [];
  for (const p of progress) {
    const ep = episodes.find((e) => e.id === p.key);
    const raw = ep?.title ?? titles.find((x) => x.id === p.key);
    if (!raw?.published || seen.has(raw.id)) continue;
    seen.add(raw.id);
    recent.push({
      href: ep ? `/watch/${raw.slug}?ep=${ep.id}` : `/watch/${raw.slug}`,
      title: localizeTitle(raw, t.locale),
      sub: ep ? t("account.episodeN", { n: ep.number }) : undefined,
    });
  }

  // نهاية الوصول: الأبعد بين الاشتراك المتجدد والأيام المدفوعة مسبقًا
  const ends = [user.currentPeriodEnd, user.accessUntil].filter((d): d is Date => !!d && d > new Date());
  const end = ends.length ? new Date(Math.max(...ends.map((d) => d.getTime()))) : null;
  const daysLeft = end ? Math.ceil((end.getTime() - Date.now()) / DAY) : 0;
  const pct = Math.min(100, Math.round((daysLeft / (daysLeft > 31 ? 365 : 30)) * 100));
  const initial = (user.username || user.name || "?").trim().charAt(0).toUpperCase();
  const other = t.locale === "ar" ? "en" : "ar";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
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

      {/* الملف الشخصي */}
      <section className="card relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(30rem_10rem_at_0%_0%,rgba(124,92,255,.22),transparent)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-violet via-brand-blue to-brand-cyan text-2xl font-extrabold text-white shadow-[0_0_24px_-6px_rgba(124,92,255,.8)]">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{user.name}</h1>
            {user.username && <p className="text-sm text-brand" dir="auto">@{user.username}</p>}
            <p className="truncate text-sm text-neutral-400" dir="ltr">{user.email}</p>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/5 px-3 py-1 text-neutral-300 ring-1 ring-white/10">
            {t("account.memberSince", { date: user.createdAt.toLocaleDateString(t.locale, { month: "long", year: "numeric" }) })}
          </span>
          {user.emailVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-green-300 ring-1 ring-green-500/30">
              <ShieldIcon className="h-3.5 w-3.5" />{t("account.verifiedBadge")}
            </span>
          )}
          {user.supporterSince && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-violet/25 to-brand-cyan/25 px-3 py-1 text-white ring-1 ring-brand-violet/40">
              <SparkleIcon className="h-3.5 w-3.5" />{t("account.supporter")}
            </span>
          )}
          {user.role === "ADMIN" && (
            <Link href="/admin" className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-300 ring-1 ring-amber-500/30">{t("account.admin")}</Link>
          )}
        </div>
      </section>

      {/* إحصاءات */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { icon: <FilmIcon className="h-5 w-5" />, n: seen.size, label: t("account.statWatched") },
          { icon: <CardIcon className="h-5 w-5" />, n: payments.filter((p) => p.status === "approved").length, label: t("account.statPayments") },
          { icon: <ScreenIcon className="h-5 w-5" />, n: MAX_STREAMS, label: t("account.statDevices") },
        ].map((s) => (
          <div key={s.label} className="card flex flex-col items-center gap-1 p-4 text-center">
            <span className="text-brand">{s.icon}</span>
            <span className="text-2xl font-extrabold">{s.n}</span>
            <span className="text-xs text-neutral-400">{s.label}</span>
          </div>
        ))}
      </div>

      {/* الاشتراك */}
      <Section icon={<CardIcon className="h-5 w-5" />} title={t("account.subscription")}>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-neutral-400">{t("account.status")} </span>
            <span className={sub ? "text-green-400" : "text-yellow-400"}>
              {user.role === "ADMIN" ? t("account.admin") : sub && !["active", "trialing"].includes(user.subscriptionStatus) ? t("account.supporterAccess") : status(user.subscriptionStatus)}
            </span>
          </p>
          {plan && <p><span className="text-neutral-400">{t("account.plan")} </span>{t(plan.nameKey)}</p>}
          {end && <p><span className="text-neutral-400">{t("account.accessUntil")} </span>{end.toLocaleDateString(t.locale)}</p>}
        </div>
        {end ? (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-neutral-400"><span>{t("account.daysLeft", { n: daysLeft })}</span><span>{pct}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : (
          user.role !== "ADMIN" && <p className="mt-3 text-sm text-neutral-400">{t("account.noAccess")}</p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/pricing" className="btn-primary">{sub ? t("account.extend") : t("account.subscribe")}</Link>
          <Link href="/redeem" className="btn-ghost"><GiftIcon />{t("account.redeem")}</Link>
          <Link href="/support" className="btn-ghost"><HeartIcon />{t("account.supportUs")}</Link>
          {((stripe && user.stripeCustomerId) || (paddle && user.paddleCustomerId)) && (
            <form action="/api/portal" method="post"><button className="btn-ghost">{t("account.manage")}</button></form>
          )}
        </div>
      </Section>

      {/* تابع المشاهدة */}
      <Section icon={<PlayIcon className="h-5 w-5" />} title={t("account.continue")}>
        {recent.length ? (
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {recent.slice(0, 8).map((r) => (
              <Link key={r.href} href={r.href} className="group w-28 shrink-0 sm:w-32">
                <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-neutral-800">
                  {r.title.posterUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.title.posterUrl} alt={r.title.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                    <PlayIcon className="h-8 w-8 text-white" />
                  </span>
                </div>
                <p className="mt-1.5 truncate text-sm">{r.title.name}</p>
                {r.sub && <p className="text-xs text-neutral-500">{r.sub}</p>}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-400">
            <span>{t("account.nothingYet")}</span>
            <Link href="/browse" className="btn-ghost py-1.5 text-sm">{t("account.browse")}<ArrowNextIcon /></Link>
          </div>
        )}
      </Section>

      {/* الإعدادات */}
      <Section icon={<UserIcon className="h-5 w-5" />} title={t("account.settings")}>
        {user.username && (
          <p className="mb-4 rounded-md bg-white/5 p-3 text-xs text-neutral-400">
            <span className="font-semibold text-white" dir="auto">@{user.username}</span> — {t("account.usernameLocked")}
          </p>
        )}
        <div className="grid gap-6 sm:grid-cols-2">
          <SimpleForm action={updateName} label={t("account.save")}>
            <div>
              <label className="label">{t("account.changeName")}</label>
              <input name="name" defaultValue={user.name} maxLength={60} required className="input" />
            </div>
          </SimpleForm>
          <SimpleForm action={changePassword} label={t("account.updatePassword")}>
            <div>
              <label className="label flex items-center gap-1.5"><KeyIcon className="h-3.5 w-3.5" />{t("account.changePassword")}</label>
              <input name="current" type="password" required autoComplete="current-password" placeholder={t("account.currentPassword")} className="input" dir="ltr" />
            </div>
            <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder={t("account.newPassword")} className="input" dir="ltr" />
          </SimpleForm>
        </div>
      </Section>

      {/* المدفوعات */}
      {payments.length > 0 && (
        <Section icon={<CardIcon className="h-5 w-5" />} title={t("pay.history")}>
          <div className="divide-y divide-white/5 text-sm">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p>{isItem(p.item) ? `${t(ITEMS[p.item].nameKey)} · ${ITEMS[p.item].usd}` : p.item === "donation" ? t("support.donation") : p.item}</p>
                  <p className="text-xs text-neutral-500">{p.method} · {p.createdAt.toLocaleDateString(t.locale)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs ${p.status === "approved" ? "bg-green-500/10 text-green-400" : p.status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-300"}`}>
                  {t(`pay.status.${p.status as "pending"}`)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* المساعدة والتفضيلات */}
      <Section icon={<ChatIcon className="h-5 w-5" />} title={t("account.help")}>
        <div className="divide-y divide-white/5 text-sm">
          {whatsapp && (
            <a href={waLink(whatsapp, `Nexora — ${user.username ?? user.email}`)} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 hover:text-white">
              <ChatIcon className="h-4 w-4 text-[#25D366]" /><span className="flex-1">{t("account.whatsapp")}</span><ArrowNextIcon className="h-4 w-4 text-neutral-500" />
            </a>
          )}
          {contactEmail() && (
            <a href={`mailto:${contactEmail()}`} className="flex items-center gap-3 py-3 hover:text-white">
              <MailIcon className="h-4 w-4 text-neutral-400" /><span className="flex-1">{t("account.emailUs")}</span><ArrowNextIcon className="h-4 w-4 text-neutral-500" />
            </a>
          )}
          <a href={`/lang?l=${other}&next=/account`} className="flex items-center gap-3 py-3 hover:text-white">
            <GlobeIcon className="h-4 w-4 text-neutral-400" /><span className="flex-1">{t("account.language")}</span><ArrowNextIcon className="h-4 w-4 text-neutral-500" />
          </a>
          <Link href="/terms" className="flex items-center gap-3 py-3 hover:text-white">
            <DocIcon className="h-4 w-4 text-neutral-400" /><span className="flex-1">{t("account.legal")}</span><ArrowNextIcon className="h-4 w-4 text-neutral-500" />
          </Link>
        </div>
      </Section>

      <form action={logout} className="mt-6">
        <button className="btn w-full bg-red-500/10 text-red-300 ring-1 ring-red-500/20 hover:bg-red-500/20"><LogoutIcon />{t("account.logout")}</button>
      </form>
    </div>
  );
}
