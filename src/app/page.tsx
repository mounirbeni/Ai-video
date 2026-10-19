import Link from "next/link";
import { db } from "@/lib/db";
import Row from "@/components/Row";

export const dynamic = "force-dynamic";

export default async function Home() {
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
        <section className="relative h-[70vh] min-h-[420px] overflow-hidden">
          {(h.backdropUrl || h.posterUrl) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={h.backdropUrl || h.posterUrl!} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-l from-neutral-950 via-neutral-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16">
            <h1 className="max-w-2xl text-4xl font-extrabold sm:text-6xl">{h.name}</h1>
            <p className="mt-4 line-clamp-3 max-w-xl text-neutral-300">{h.description}</p>
            <div className="mt-6 flex gap-3">
              {h.comingSoon ? (
                <span className="btn bg-amber-500/20 text-amber-300">قريبًا{h.releaseLabel && ` · ${h.releaseLabel}`}</span>
              ) : (
                <Link href={`/watch/${h.slug}`} className="btn-primary">▶ شاهد الآن</Link>
              )}
              <Link href={`/title/${h.slug}`} className="btn-ghost">المزيد من المعلومات</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="mx-auto max-w-3xl px-4 py-32 text-center">
          <h1 className="text-4xl font-extrabold">مرحبًا بك في منصتي</h1>
          <p className="mt-4 text-neutral-400">لا يوجد محتوى منشور بعد. أضف أفلامك ومسلسلاتك من لوحة التحكم.</p>
          <Link href="/admin" className="btn-primary mt-6">لوحة التحكم</Link>
        </section>
      )}
      <Row title="قريبًا" items={soon} />
      <Row title="أحدث الإضافات" items={latest} />
      <Row title="الأفلام" items={movies} />
      <Row title="المسلسلات" items={series} />
      <Row title="شاهد مجانًا" items={free} />
    </>
  );
}
