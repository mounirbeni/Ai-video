import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUser, isSubscribed } from "@/lib/auth";
import { genresList } from "@/lib/utils";
import { getLocale, getT } from "@/lib/i18n/server";
import { localizeTitle } from "@/lib/i18n/localize";

export const dynamic = "force-dynamic";

export default async function TitlePage({ params }: { params: { slug: string } }) {
  const raw = await db.title.findUnique({
    where: { slug: decodeURIComponent(params.slug) },
    include: { episodes: { orderBy: [{ season: "asc" }, { number: "asc" }] } },
  });
  if (!raw || !raw.published) notFound();
  const t = localizeTitle(raw, getLocale());
  const subscribed = isSubscribed(await getUser());
  const tr = getT();
  const seasons = Array.from(new Set(t.episodes.map((e) => e.season)));
  // ملف فيديو (مرفوع أو داخل الموقع) يُعرض في مشغّل مجاني بالصفحة؛ غير ذلك (يوتيوب مثلًا) يبقى رابطًا خارجيًا
  const inlineTrailer = !!t.trailerUrl && (t.trailerUrl.startsWith("/") || /\.(mp4|webm|mov)(\?|$)/i.test(t.trailerUrl));

  return (
    <div>
      <section className="relative">
        {(t.backdropUrl || t.posterUrl) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.backdropUrl || t.posterUrl!} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-neutral-950/40" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-14 md:flex-row">
          {t.posterUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.posterUrl} alt={t.name} className="w-36 shrink-0 self-start rounded-xl shadow-2xl sm:w-56" />
          )}
          <div className="max-w-2xl">
            <p className="text-sm text-brand">{tr(`type.${t.type as "MOVIE" | "SERIES"}`)}</p>
            <h1 className="mt-1 text-4xl font-extrabold">{t.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-neutral-400">
              {t.year && <span>{t.year}</span>}
              {t.type === "MOVIE" && t.duration && <span>• {tr("title.minutes", { n: t.duration })}</span>}
              {t.type === "SERIES" && (t.episodes.length || t.plannedEpisodes) ? (
                <span>• {(t.episodes.length || t.plannedEpisodes) === 1 ? tr("title.episode") : tr("title.episodes", { n: t.episodes.length || t.plannedEpisodes! })}</span>
              ) : null}
              {t.language && <span>• {tr(`lang.${t.language}` as "lang.en")}</span>}
              {genresList(t.genres).map((g) => (
                <span key={g} className="rounded bg-white/10 px-2">{g}</span>
              ))}
            </div>
            <p className="mt-5 whitespace-pre-line leading-8 text-neutral-200">{t.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {t.comingSoon && (
                <span className="btn bg-amber-500/20 text-amber-300">{tr("badge.soon")}{t.releaseLabel && ` · ${t.releaseLabel}`}</span>
              )}
              {!t.comingSoon && (t.type === "MOVIE" || t.episodes.length > 0) && (
                <Link href={`/watch/${t.slug}`} className="btn-primary">
                  {subscribed || t.isFree ? tr("title.watch") : tr("title.subscribeToWatch")}
                </Link>
              )}
              {t.trailerUrl && inlineTrailer && (
                <a href="#trailer" className={t.comingSoon ? "btn-primary" : "btn-ghost"}>{tr("title.watchTrailer")}</a>
              )}
              <Link href="/support" className="btn-ghost">{tr("support.thisTitle")}</Link>
              {t.trailerUrl && !inlineTrailer && (
                <a href={t.trailerUrl} target="_blank" rel="noreferrer" className="btn-ghost">{tr("title.trailer")}</a>
              )}
            </div>
          </div>
        </div>
      </section>

      {inlineTrailer && (
        <section id="trailer" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-8">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-2xl font-bold">{tr("title.trailer")}</h2>
            <span className="rounded-full bg-gradient-to-r from-brand-violet/30 to-brand-cyan/30 px-2.5 py-0.5 text-xs text-white ring-1 ring-brand-violet/40">{tr("title.trailerFree")}</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_60px_-20px_rgba(124,92,255,.6)]">
            <video
              src={t.trailerUrl!}
              poster={t.backdropUrl || t.posterUrl || undefined}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full"
            />
          </div>
        </section>
      )}

      {t.type === "SERIES" && !t.comingSoon && (
        <section className="mx-auto max-w-7xl px-4 py-8">
          <h2 className="mb-4 text-2xl font-bold">{tr("title.episodesHeading")}</h2>
          {seasons.map((s) => (
            <div key={s} className="mb-8">
              {seasons.length > 1 && <h3 className="mb-3 text-lg text-neutral-400">{tr("title.season", { n: s })}</h3>}
              <div className="divide-y divide-white/5 rounded-xl border border-white/10">
                {t.episodes.filter((e) => e.season === s).map((e) => {
                  const open = subscribed || t.isFree || e.isFree;
                  return (
                    <Link key={e.id} href={`/watch/${t.slug}?ep=${e.id}`} className="flex items-center gap-4 p-4 hover:bg-white/5">
                      <span className="w-8 text-2xl font-bold text-neutral-500">{e.number}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{e.name}</p>
                        {e.description && <p className="line-clamp-2 text-sm text-neutral-400">{e.description}</p>}
                      </div>
                      {e.duration && <span className="text-sm text-neutral-500">{tr("title.minShort", { n: e.duration })}</span>}
                      <span>{open ? "▶" : "🔒"}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          {!t.episodes.length && <p className="text-neutral-400">{tr("title.noEpisodes")}</p>}
        </section>
      )}
    </div>
  );
}
