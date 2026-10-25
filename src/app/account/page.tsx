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
import { accessKind, streamLimit } from "@/lib/access";
import PlanBadge from "@/components/PlanBadge";
import { contactEmail } from "@/lib/contact";
import AvatarPicker from "@/components/AvatarPicker";
import UserAvatar from "@/components/UserAvatar";
import SimpleForm from "@/components/SimpleForm";
import { getAccountIdentity } from "@/lib/account-identity";
import { identityLabelKey } from "@/lib/identity";
import IdentityBadge, { IdentityMark } from "@/components/IdentityBadge";
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

export default async function Account({ searchParams: searchParamsPromise }: { searchParams: Promise<{ success?: string; verify?: string; sent?: string; reset?: string }> }) {
  const searchParams = await searchParamsPromise;

  const user = await requireUser("/account");
  const identity = getAccountIdentity(user);
  const sub = isSubscribed(user);
  const plan = user.subscriptionPlan ? PLANS[user.subscriptionPlan as PlanId] : null;
  const t = (await getT());
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
      <section data-profile-identity={identity || undefined} className={`card relative overflow-hidden ${identity === "admin" ? "border-amber-300/35 bg-gradient-to-br from-amber-950/50 via-neutral-950 to-violet-950/40 shadow-[0_16px_80px_-40px_rgba(245,158,11,.6)]" : identity === "developer" ? "border-cyan-300/35 bg-gradient-to-br from-cyan-950/60 via-neutral-950 to-violet-950/60 shadow-[0_16px_80px_-40px_rgba(34,211,238,.6)]" : ""}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(30rem_10rem_at_0%_0%,rgba(124,92,255,.22),transparent)]" />
        {identity && <div className="relative mb-7 flex flex-wrap items-center justify-between gap-3">
          <p className={`text-[10px] font-bold tracking-[.24em] ${identity === "admin" ? "text-amber-200/70" : "text-cyan-200/70"}`}>{t("identity.team")}</p>
          <IdentityBadge identity={identity} label={t(identityLabelKey(identity))} />
        </div>}
        <div className="relative flex items-center gap-4 sm:gap-6">
          <a href="#avatar-settings" className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand" aria-label={t("avatar.choose")}>
            <UserAvatar role={user.role} identity={identity} avatarId={user.avatarId} name={user.username || user.name} decorative className={identity ? "h-20 w-20 text-3xl sm:h-28 sm:w-28" : "h-16 w-16 text-2xl"} />
          </a>
          <div className="min-w-0">
            <h1 className={`truncate text-2xl font-bold ${identity === "admin" ? "text-amber-100 sm:text-3xl" : identity === "developer" ? "text-cyan-100 sm:text-3xl" : ""}`}>{user.name}</h1>
            {user.username && <p className="text-sm text-brand" dir="auto">@{user.username}</p>}
            <p className="truncate text-sm text-neutral-400" dir="ltr">{user.email}</p>
            <a href="#avatar-settings" className="mt-2 inline-block rounded text-xs font-semibold text-brand-cyan hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">{t("avatar.change")}</a>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2 text-xs">
          <PlanBadge kind={accessKind(user)} label={t(`plan.kind.${accessKind(user)}`)} />
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
        </div>
        {identity && <div className="relative mt-6 border-t border-white/10 pt-5">
          <div className={`pointer-events-none absolute -end-4 top-2 opacity-[.06] ${identity === "admin" ? "text-amber-200" : "text-cyan-200"}`}><IdentityMark identity={identity} className="h-32 w-32" /></div>
          <h2 className="relative text-lg font-bold">{t(identity === "admin" ? "identity.adminTitle" : "identity.developerTitle")}</h2>
          <p className="relative mt-2 max-w-lg text-sm leading-7 text-neutral-300">{t(identity === "admin" ? "identity.adminDescription" : "identity.developerDescription")}</p>
          <div className={`relative mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs ${identity === "admin" ? "text-amber-200" : "text-cyan-200"}`}>
            {(["identity.signatureAvatar", "identity.officialBadge", "identity.customProfile"] as const).map((key) => <span key={key} className="inline-flex items-center gap-1.5"><SparkleIcon className="h-3 w-3" />{t(key)}</span>)}
          </div>
        </div>}
        <div className="relative mt-5 flex flex-wrap gap-2">
          <Link href="/community" className="btn-ghost py-2 text-sm"><ChatIcon className="h-4 w-4" />{t("community.nav")}</Link>
          <Link href="/my-list" className="btn-ghost py-2 text-sm">{t("list.title")}</Link>
          {user.role === "ADMIN" && <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-sm font-semibold text-amber-200"><ShieldIcon className="h-4 w-4" />{t("nav.admin")}</Link>}
        </div>
      </section>

      <section id="avatar-settings" className="card mt-6 scroll-mt-24"><AvatarPicker role={user.role} identity={identity} currentAvatarId={user.avatarId} name={user.username || user.name} /></section>

      {/* إحصاءات */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { icon: <FilmIcon className="h-5 w-5" />, n: seen.size, label: t("account.statWatched") },
          { icon: <CardIcon className="h-5 w-5" />, n: payments.filter((p) => p.status === "approved").length, label: t("account.statPayments") },
          { icon: <ScreenIcon className="h-5 w-5" />, n: streamLimit(user), label: t("account.statDevices") },
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
