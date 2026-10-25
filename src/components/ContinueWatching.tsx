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
    return [{ title, ep, seconds: p.seconds, href: `/watch/${title.slug}${ep ? `?ep=${ep.id}` : ""}` }];
  });
  // One card per series, preserving the most recently watched episode.
  const unique = cards.filter((c, i) => cards.findIndex((x) => x.title.id === c.title.id) === i).slice(0, 12);
  if (!unique.length) return null;
  return <section className="mx-auto max-w-7xl px-4 py-6">
    <h2 className="mb-4 text-xl font-bold">{t("continue.title")}</h2>
    <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">{unique.map(({ title, ep, seconds, href }) => <Link key={title.id} href={href} className="w-64 shrink-0 rounded-xl border border-white/10 bg-neutral-900 p-3 hover:border-brand">
      {(ep?.thumbUrl || title.backdropUrl || title.posterUrl) && <img src={ep?.thumbUrl || title.backdropUrl || title.posterUrl!} alt="" className="mb-3 aspect-video w-full rounded-lg object-cover" />}
      <p className="truncate font-semibold">{title.name}</p>
      {ep && <p className="text-sm text-neutral-400">{t("watch.epShort", { s: ep.season, e: ep.number, name: t.locale === "ar" ? ep.nameAr || ep.name : ep.name })}</p>}
      <p className="mt-2 text-sm text-brand">{t("continue.resume", { n: Math.floor(seconds / 60) })}</p>
    </Link>)}</div>
  </section>;
}
