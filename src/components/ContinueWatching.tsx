import ContentRail from "./ContentRail";
import { PlayIcon } from "./Icons";
import Link from "next/link";
import { db } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { localizeTitle } from "@/lib/i18n/localize";

export default async function ContinueWatching() {
  const user = await getUser();
  if (!user) return null;
  const t = await getT();
  const progress = await db.watchProgress.findMany({ where: { userId: user.id, completed: false, seconds: { gt: 5 } }, orderBy: { updatedAt: "desc" }, take: 40 });
  if (!progress.length) return null;
  const keys = progress.map((p) => p.key);
  const published = { published: true, comingSoon: false };
  const [movies, episodes] = await Promise.all([
    db.title.findMany({ where: { ...published, id: { in: keys }, type: "MOVIE" } }),
    db.episode.findMany({ where: { id: { in: keys }, title: published }, include: { title: true } }),
  ]);
  const cards = progress.flatMap((p) => {
    const ep = episodes.find((e) => e.id === p.key);
    const raw = ep?.title ?? movies.find((m) => m.id === p.key);
    if (!raw) return [];
    const title = localizeTitle(raw, t.locale);
    const duration = ep?.duration ?? title.duration;
    if (duration && p.seconds >= duration * 60 - 10) return [];
    return [{ title, ep, percent: duration ? Math.min(100, Math.round(p.seconds / (duration * 60) * 100)) : null, seconds: p.seconds, href: `/watch/${title.slug}${ep ? `?ep=${ep.id}` : ""}` }];
  });
  // One card per series, preserving the most recently watched episode.
  const unique = cards.filter((c, i) => cards.findIndex((x) => x.title.id === c.title.id) === i).slice(0, 12);
  if (!unique.length) return null;
  return <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9">
    <h2 className="mb-4 text-xl font-bold sm:text-2xl">{t("continue.title")}</h2>
    <ContentRail title={t("continue.title")}>{unique.map(({ title, ep, percent, seconds, href }) => <Link key={title.id} href={href} className="group w-[78vw] max-w-[360px] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-white/[.025] transition hover:border-brand/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:w-80">
      <div className="relative aspect-video bg-neutral-800">
        {(ep?.thumbUrl || title.backdropUrl || title.posterUrl) && <img src={ep?.thumbUrl || title.backdropUrl || title.posterUrl!} alt="" loading="lazy" decoding="async" width={640} height={360} className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute bottom-3 start-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-950 transition group-hover:bg-brand-cyan" aria-hidden="true"><PlayIcon className="h-5 w-5" /></span>
        {percent !== null && <div role="progressbar" aria-label={title.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="absolute inset-x-0 bottom-0 h-1 bg-white/20"><div className="h-full bg-brand-cyan" style={{ width: `${percent}%` }} /></div>}
      </div>
      <div className="p-4"><p className="truncate font-bold">{title.name}</p>
        {ep && <p className="mt-1 line-clamp-1 text-xs text-neutral-400">{t("watch.epShort", { s: ep.season, e: ep.number, name: t.locale === "ar" ? ep.nameAr || ep.name : ep.name })}</p>}
        <p className="mt-3 text-xs font-semibold text-brand-cyan">{t("continue.resume", { n: Math.floor(seconds / 60) })}</p>
      </div>
    </Link>)}</ContentRail>
  </section>;
}
