import Link from "next/link";
import { db } from "@/lib/db";
import Row from "@/components/Row";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const t = getT();
  const published = { published: true, comingSoon: false };
  const [hero, latest, movies, series, free, soon] = await Promise.all([
    db.title.findFirst({ where: { published: true, featured: true }, orderBy: { createdAt: "desc" } }),
    db.title.findMany({ where: published, orderBy: { createdAt: "desc" }, take: 20 }),
    db.title.findMany({ where: { ...published, type: "MOVIE" }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.title.findMany({ where: { ...published, type: "SERIES" }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.title.findMany({ where: { ...published, isFree: true }, take: 20 }),
    db.title.findMany({ where: { published: true, comingSoon: true }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const h = hero ?? latest[0];

  return (
    <>
      {h ? (
        <section className="relative h-[55vh] min-h-[380px] overflow-hidden sm:h-[70vh] sm:min-h-[420px]">
          {(h.backdropUrl || h.posterUrl) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={h.backdropUrl || h.posterUrl!} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/70 to-transparent rtl:bg-gradient-to-l" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16">
            <h1 className="max-w-2xl text-4xl font-extrabold sm:text-6xl">{h.name}</h1>
            <p className="mt-4 line-clamp-3 max-w-xl text-neutral-300">{h.description}</p>
            <div className="mt-6 flex gap-3">
              {h.comingSoon ? (
                <span className="btn bg-amber-500/20 text-amber-300">{t("badge.soon")}{h.releaseLabel && ` · ${h.releaseLabel}`}</span>
              ) : (
                <Link href={`/watch/${h.slug}`} className="btn-primary">{t("home.watch")}</Link>
              )}
              <Link href={`/title/${h.slug}`} className="btn-ghost">{t("home.more")}</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-3xl px-4 py-32 text-center">
          <h1 className="text-4xl font-extrabold">{t("home.welcome")}</h1>
          <p className="mt-4 text-neutral-400">{t("home.empty")}</p>
          <Link href="/admin" className="btn-primary mt-6">{t("nav.admin")}</Link>
        </section>
      )}
      <Row title={t("row.soon")} items={soon} />
      <Row title={t("row.latest")} items={latest} />
      <Row title={t("row.movies")} items={movies} />
      <Row title={t("row.series")} items={series} />
      <Row title={t("row.free")} items={free} />
      <section className="mx-auto mt-14 max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 p-6 sm:p-10">
          <div className="pointer-events-none absolute -end-20 -top-24 h-64 w-64 rounded-full bg-brand-violet/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 end-40 h-56 w-56 rounded-full bg-brand-cyan/20 blur-3xl" />
          <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold sm:text-3xl">{t("support.homeTitle")}</h2>
              <p className="mt-2 text-neutral-400">{t("support.homeText")}</p>
            </div>
            <Link href="/support" className="btn-primary">{t("support.nav")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
