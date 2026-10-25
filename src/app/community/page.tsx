import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCommunityFeed } from "@/lib/community";
import { COMMUNITY_CATEGORIES, isCommunityCategory } from "@/lib/community-options";
import { getT } from "@/lib/i18n/server";
import { ArrowNextIcon, ChatIcon, DocIcon, ShieldIcon, SparkleIcon } from "@/components/Icons";
import CommunityAuthor from "@/components/CommunityAuthor";
import UserAvatar from "@/components/UserAvatar";

export default async function Community({ searchParams }: { searchParams: Promise<{ page?: string; category?: string; view?: string; deleted?: string }> }) {
  const [user, t, params] = await Promise.all([requireUser("/community"), getT(), searchParams]);
  const { posts, publisher, manage, page, hasNext, category } = await getCommunityFeed(user, params);
  function href(nextPage = 1, nextCategory: typeof category | "" = category, nextManage = manage) {
    const q = new URLSearchParams();
    if (nextPage > 1) q.set("page", String(nextPage));
    if (nextCategory) q.set("category", nextCategory);
    if (nextManage) q.set("view", "manage");
    return `/community${q.size ? `?${q}` : ""}`;
  }
  return <>
    <section className="relative overflow-hidden rounded-3xl border border-violet-300/20 bg-gradient-to-br from-violet-950/70 via-neutral-950 to-cyan-950/40 p-6 sm:p-10">
      <div className="pointer-events-none absolute -end-12 -top-16 h-64 w-64 rounded-full bg-brand-violet/10 blur-3xl" />
      <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div className="max-w-xl"><p className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-brand-cyan"><SparkleIcon className="h-4 w-4" />{t("community.eyebrow")}</p><h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t("community.title")}</h1><p className="mt-4 text-sm leading-8 text-neutral-300 sm:text-base">{t("community.description")}</p></div>
        <div className="flex shrink-0 items-center gap-5"><UserAvatar role="ADMIN" identity="admin" name={t("identity.admin")} className="h-16 w-16 sm:h-20 sm:w-20" /><UserAvatar identity="developer" name={t("identity.developer")} className="h-16 w-16 sm:h-20 sm:w-20" /></div>
      </div>
      {publisher && <Link href="/community/new" className="btn-primary relative mt-6"><DocIcon />{t("community.new")}</Link>}
    </section>
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="min-w-0">
        {publisher && <nav aria-label={t("community.viewLabel")} className="mb-5 flex gap-2"><Link href={href(1, category, false)} aria-current={!manage ? "page" : undefined} className={!manage ? "btn-primary py-2 text-sm" : "btn-ghost py-2 text-sm"}>{t("community.published")}</Link><Link href={href(1, category, true)} aria-current={manage ? "page" : undefined} className={manage ? "btn-primary py-2 text-sm" : "btn-ghost py-2 text-sm"}>{t("community.manage")}</Link></nav>}
        <nav aria-label={t("community.categoryLabel")} className="mb-6 flex flex-wrap gap-2">
          {[undefined, ...COMMUNITY_CATEGORIES].map((c) => <Link key={c || "all"} href={href(1, c || "")} aria-current={c === category ? "page" : undefined} className={`rounded-full border px-4 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${c === category ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan" : "border-white/10 text-neutral-400 hover:text-white"}`}>{c ? t(`community.category.${c}`) : t("community.all")}</Link>)}
        </nav>
        {manage && params.deleted === "1" && <p role="status" className="mb-5 rounded-xl bg-emerald-400/10 p-4 text-sm text-emerald-200">{t("community.deleted")}</p>}
        <div className="space-y-5">
          {posts.map((post) => <article key={post.id} data-community-post={post.id} className={`rounded-2xl border bg-white/[.025] p-5 sm:p-7 ${post.pinned ? "border-brand-violet/35" : "border-white/10"}`}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><CommunityAuthor author={post.author} date={post.createdAt} /><div className="flex flex-wrap gap-2 text-[11px]">{post.pinned && <span className="rounded-full bg-brand-violet/15 px-2.5 py-1 text-violet-200">{t("community.pinned")}</span>}{!post.published && <span className="rounded-full bg-amber-300/10 px-2.5 py-1 text-amber-200">{t("community.draft")}</span>}</div></div>
            <span className="text-xs font-medium text-brand-cyan">{t(`community.category.${isCommunityCategory(post.category) ? post.category : "updates"}`)}</span>
            <h2 className="mt-2 text-xl font-bold leading-8 sm:text-2xl" dir="auto"><Link href={`/community/${post.id}`} className="rounded hover:text-violet-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">{post.title}</Link></h2>
            <p className="mt-3 line-clamp-3 whitespace-pre-line break-words text-sm leading-8 text-neutral-400" dir="auto">{post.body.slice(0, 360)}</p>
            <div className="mt-5 flex items-center justify-between gap-3"><Link href={`/community/${post.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-cyan">{t("community.read")}<ArrowNextIcon /></Link>{publisher && <Link href={`/community/${post.id}/edit`} className="btn-ghost py-1.5 text-xs">{t("community.edit")}</Link>}</div>
          </article>)}
          {!posts.length && <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center"><ChatIcon className="mx-auto h-10 w-10 text-brand-violet" /><h2 className="mt-5 text-xl font-bold">{t("community.emptyTitle")}</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-neutral-400">{t(manage ? "community.emptyManage" : "community.empty")}</p>{publisher && <Link href="/community/new" className="btn-primary mt-6">{t("community.new")}</Link>}</div>}
        </div>
        {(page > 1 || hasNext) && <nav aria-label={t("community.pagination")} className="mt-7 flex items-center justify-between gap-3">{page > 1 ? <Link href={href(page - 1)} className="btn-ghost">{t("community.previous")}</Link> : <span />}<span className="text-xs text-neutral-400">{t("community.page", { n: page })}</span>{hasNext ? <Link href={href(page + 1)} className="btn-ghost">{t("community.next")}</Link> : <span />}</nav>}
      </div>
      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start"><div className="card"><ShieldIcon className="h-6 w-6 text-brand-cyan" /><h2 className="mt-4 font-bold">{t("community.aboutTitle")}</h2><p className="mt-3 text-sm leading-8 text-neutral-400">{t("community.about")}</p><div className="mt-5 border-t border-white/10 pt-4 text-xs leading-7 text-neutral-400">{t("community.readOnly")}</div></div><Link href="/account" className="flex items-center justify-between rounded-xl border border-white/10 px-5 py-4 text-sm text-neutral-300">{t("nav.account")}<ArrowNextIcon /></Link></aside>
    </div>
  </>;
}
