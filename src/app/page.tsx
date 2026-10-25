import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/db";
import { getUser, isSubscribed } from "@/lib/auth";
import ContinueWatching from "@/components/ContinueWatching";
import ContentRail from "@/components/ContentRail";
import WatchlistButton from "@/components/WatchlistButton";
import Row from "@/components/Row";
import { getT } from "@/lib/i18n/server";
import { localizeTitle, localizeEpisode } from "@/lib/i18n/localize";
import { genresList } from "@/lib/utils";
import { ArrowNextIcon, ClockIcon, FilmIcon, HeartIcon, PlayIcon, ScreenIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function Home() {
  const available = { published: true, comingSoon: false };
  const episodeCount = { _count: { select: { episodes: true } } } as const;
  const [t, user, featured, latest0, movies0, series0, free0, soon0, episodes0] = await Promise.all([
    getT(), getUser(),
    db.title.findFirst({ where: { ...available, featured: true }, orderBy: { createdAt: "desc" }, include: episodeCount }),
    db.title.findMany({ where: available, orderBy: { createdAt: "desc" }, take: 20, include: episodeCount }),
    db.title.findMany({ where: { ...available, type: "MOVIE" }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.title.findMany({ where: { ...available, type: "SERIES" }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.title.findMany({ where: { ...available, isFree: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.title.findMany({ where: { published: true, comingSoon: true }, orderBy: { createdAt: "desc" }, take: 20, include: episodeCount }),
    db.episode.findMany({ where: { title: available, videoSrc: { not: "" } }, include: { title: true }, orderBy: [{ title: { createdAt: "desc" } }, { season: "desc" }, { number: "desc" }], take: 8 }),
  ]);
  const L = <X extends Parameters<typeof localizeTitle>[0]>(x: X) => localizeTitle(x, t.locale);
  const latest = latest0.map(L), movies = movies0.map(L), series = series0.map(L), free = free0.map(L), soon = soon0.map(L);
  // Available stories take precedence over teasers, including an upcoming featured title.
  const rawHero = featured ?? latest0[0] ?? soon0[0];
  const h = rawHero && L(rawHero);
  const saved = user && h ? !!await db.watchlist.findUnique({ where: { userId_titleId: { userId: user.id, titleId: h.id } } }) : false;
  const canPlay = h && !h.comingSoon && (h.type === "MOVIE" ? !!h.videoSrc : h._count.episodes > 0);
  const subscribed = isSubscribed(user);
  const heroEpisodes = h ? h._count.episodes || h.plannedEpisodes || 0 : 0;

  return <div className="overflow-x-clip pb-4">
    {h ? <section aria-labelledby="featured-title" className="relative isolate flex min-h-[580px] items-end overflow-hidden bg-neutral-950 sm:min-h-[620px] sm:items-center lg:min-h-[700px]">
      {(h.backdropUrl || h.posterUrl) && <img src={h.backdropUrl || h.posterUrl!} alt="" fetchPriority="high" loading="eager" decoding="async" className="absolute inset-0 -z-20 h-full w-full object-cover object-top sm:object-center" />}
      <div className="home-hero-shade absolute inset-0 -z-10" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-neutral-950 to-transparent" />
      <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-36 sm:px-6 sm:py-20">
        <div className="max-w-xl lg:max-w-2xl">
          <p className="mb-5 flex items-center gap-3 text-xs font-semibold tracking-widest text-white/70">
            <span className="font-logo text-[10px] tracking-[.22em] text-brand-cyan" dir="ltr">NEXORA</span><span aria-hidden="true" className="h-px w-8 bg-white/30" />{t("home.spotlight")}
          </p>
          <span className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${h.comingSoon ? "border-amber-400/30 bg-amber-400/10 text-amber-200" : "border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan"}`}>
            {h.comingSoon ? <ClockIcon /> : <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan" />}{h.comingSoon ? t("badge.soon") : t("home.nowStreaming")}
          </span>
          <h1 id="featured-title" className="text-balance text-4xl font-extrabold leading-[1.2] tracking-tight sm:text-5xl lg:text-6xl">{h.name}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-white/70 sm:text-sm">
            <span className="rounded border border-white/20 px-2 py-0.5">{t(`type.${h.type as "MOVIE" | "SERIES"}`)}</span>
            {h.year && <span>{h.year}</span>}
            {h.type === "MOVIE" && h.duration ? <span>{t("title.minutes", { n: h.duration })}</span> : null}
            {h.type === "SERIES" && heroEpisodes > 0 ? <span>{heroEpisodes === 1 ? t("title.episode") : t("title.episodes", { n: heroEpisodes })}</span> : null}
            {genresList(h.genres).slice(0, 2).map((genre) => <span key={genre} className="text-white/60">{genre}</span>)}
            {h.isFree && !h.comingSoon && <span className="text-emerald-300">{t("home.free")}</span>}
          </div>
          <p className="mt-5 line-clamp-2 max-w-lg sm:line-clamp-3 text-sm leading-7 text-neutral-300 sm:text-base sm:leading-8">{h.description}</p>
          {h.comingSoon && h.releaseLabel && <p className="mt-3 text-sm text-amber-200">{h.releaseLabel}</p>}
          <div className="mt-7 flex flex-wrap items-start gap-3">
            {canPlay && <Link href={`/watch/${h.slug}`} className="btn-primary min-h-12 px-6"><PlayIcon className="h-5 w-5" />{t("home.watch")}</Link>}
            {h.trailerUrl && <Link href={`/title/${h.slug}#trailer`} className={`btn-ghost min-h-12 border border-white/15 ${canPlay ? "hidden sm:inline-flex" : ""}`}><PlayIcon />{t("title.watchTrailer")}</Link>}
            {user ? <WatchlistButton titleId={h.id} saved={saved} /> : <Link href={`/login?next=${encodeURIComponent(`/title/${h.slug}`)}`} className="btn-ghost min-h-12 border border-white/15">{t("list.add")}</Link>}
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            <Link href={`/title/${h.slug}`} className="inline-flex items-center gap-2 rounded py-1 text-sm text-white/60 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">{t("home.more")}<ArrowNextIcon /></Link>
            {canPlay && h.trailerUrl && <Link href={`/title/${h.slug}#trailer`} className="inline-flex items-center gap-2 rounded py-1 text-sm text-white/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand sm:hidden"><PlayIcon />{t("title.watchTrailer")}</Link>}
          </div>
        </div>
      </div>
    </section> : <section className="mx-auto max-w-3xl px-4 py-24 text-center sm:py-36">
      <p className="mb-5 font-logo text-xs tracking-[.3em] text-brand-cyan" dir="ltr">NEXORA</p>
      <h1 className="text-4xl font-extrabold sm:text-5xl">{t("home.welcome")}</h1>
      <p className="mt-5 leading-8 text-neutral-400">{t("home.emptyPublic")}</p>
      {user?.role === "ADMIN" && <Link href="/admin" className="btn-primary mt-6">{t("nav.admin")}</Link>}
    </section>}

    <section aria-labelledby="explore-heading" className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div><h2 id="explore-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">{t("home.explore")}</h2><p className="mt-2 text-sm leading-6 text-neutral-400">{t("home.exploreText")}</p></div>
        <form action="/browse" role="search" className="flex w-full gap-2 lg:max-w-sm">
          <label htmlFor="home-search" className="sr-only">{t("home.searchLabel")}</label>
          <input id="home-search" type="search" name="q" placeholder={t("home.searchLabel")} maxLength={200} className="input min-w-0 rounded-full border-white/15 bg-white/[.035] px-5" />
          <button type="submit" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 transition hover:bg-brand-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand" aria-label={t("home.searchButton")}><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg></button>
        </form>
      </div>
      <nav aria-label={t("home.collections")} className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2">
        <Link href="/community" className="home-pill">{t("community.nav")}<ArrowNextIcon /></Link>
        <Link href={latest.length ? "#available" : "/browse"} className="home-pill border-brand/40 bg-brand/10 text-white"><PlayIcon />{t("home.available")}</Link>
        <Link href="/browse?type=SERIES" className="home-pill"><ScreenIcon />{t("nav.series")}</Link>
        <Link href="/browse?type=MOVIE" className="home-pill"><FilmIcon />{t("nav.movies")}</Link>
        {soon.length > 0 && <Link href="#coming-soon" className="home-pill"><ClockIcon />{t("row.soon")}</Link>}
        <Link href="/my-list" className="home-pill">{t("list.title")}<ArrowNextIcon /></Link>
      </nav>
    </section>

    <Suspense fallback={null}><ContinueWatching /></Suspense>

    {episodes0.length > 0 && <section aria-labelledby="episodes-heading" className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9">
      <div className="mb-4"><h2 id="episodes-heading" className="text-xl font-bold sm:text-2xl">{t("home.episodes")}</h2><p className="mt-1.5 text-sm text-neutral-400">{t("home.episodesHint")}</p></div>
      <ContentRail title={t("home.episodes")}>{episodes0.map((raw) => {
        const ep = localizeEpisode(raw, t.locale), title = L(raw.title);
        const image = ep.thumbUrl || title.backdropUrl || title.posterUrl;
        return <Link key={ep.id} href={`/watch/${title.slug}?ep=${ep.id}`} className="group w-[78vw] max-w-[360px] shrink-0 snap-start rounded-2xl border border-white/10 bg-white/[.025] transition hover:border-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:w-80">
          <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-neutral-800">
            {image && <img src={image} alt="" loading="lazy" decoding="async" width={640} height={360} className="h-full w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transform-none" />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
            <span className="absolute bottom-3 start-3 rounded-md border border-white/20 bg-black/65 px-2 py-1 text-xs text-white">{t("home.episodeLabel", { s: ep.season, e: ep.number })}</span>
            <span className="absolute bottom-3 end-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-950 transition group-hover:bg-brand-cyan" aria-hidden="true"><PlayIcon /></span>
          </div>
          <div className="p-4"><p className="truncate text-xs font-semibold text-brand-cyan">{title.name}</p><h3 className="mt-1 line-clamp-1 font-bold">{ep.name}</h3><div className="mt-3 flex items-center justify-between text-xs text-neutral-400"><span className="inline-flex items-center gap-1.5">{t("home.playEpisode")}<ArrowNextIcon /></span>{ep.duration ? <span>{t("title.minutes", { n: ep.duration })}</span> : null}</div></div>
        </Link>;
      })}</ContentRail>
    </section>}

    <Row id="available" title={t("row.latest")} description={t("home.latestHint")} items={latest} href="/browse?status=available" />
    <Row title={t("row.free")} description={t("home.freeHint")} items={free} href="/browse?status=free" />
    <Row title={t("row.movies")} items={movies} href="/browse?type=MOVIE&status=available" />
    <Row title={t("row.series")} items={series} href="/browse?type=SERIES&status=available" />
    <Row id="coming-soon" title={t("row.soon")} description={t("home.soonHint")} items={soon} href="/browse?status=soon" />

    <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.25fr_1fr]">
      <div className="relative isolate overflow-hidden rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/15 via-neutral-900 to-neutral-900 p-7 sm:p-10">
        <span className="mb-6 block h-1 w-10 rounded-full bg-brand-cyan" />
        <h2 className="max-w-md text-2xl font-bold leading-snug sm:text-3xl">{subscribed ? t("home.yourLibrary") : t("home.subscribeTitle")}</h2>
        <p className="mt-3 max-w-md text-sm leading-7 text-neutral-400">{subscribed ? t("home.libraryText") : t("home.subscribeText")}</p>
        <Link href={subscribed ? "/my-list" : "/pricing"} className="btn-primary mt-6">{subscribed ? t("home.openList") : t("home.plans")}<ArrowNextIcon /></Link>
      </div>
      <div className="flex flex-col items-start justify-center rounded-2xl border border-white/10 bg-white/[.025] p-7 sm:p-10">
        <HeartIcon className="mb-5 h-6 w-6 text-brand-violet" /><h2 className="text-2xl font-bold">{t("home.supportTitle")}</h2><p className="mt-3 text-sm leading-7 text-neutral-400">{t("home.supportText")}</p><Link href="/support" className="mt-5 inline-flex items-center gap-2 rounded py-1 text-sm font-semibold text-white hover:text-brand-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">{t("support.nav")}<ArrowNextIcon /></Link>
      </div>
    </section>
  </div>;
}
