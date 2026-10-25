import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUser, isSubscribed } from "@/lib/auth";
import { readSubtitles } from "@/lib/subtitles";
import Player from "@/components/Player";
import { getLocale, getT } from "@/lib/i18n/server";
import { localizeTitle } from "@/lib/i18n/localize";
import { ArrowNextIcon, ClockIcon, LockIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function Watch({ params: paramsPromise, searchParams: searchParamsPromise }: { params: Promise<{ slug: string }>; searchParams: Promise<{ ep?: string }> }) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;

  const raw = await db.title.findUnique({
    where: { slug: decodeURIComponent(params.slug) },
    include: { episodes: { orderBy: [{ season: "asc" }, { number: "asc" }] } },
  });
  if (!raw || !raw.published) notFound();
  const t = localizeTitle(raw, (await getLocale()));

  const user = await getUser();
  // الحسابات القديمة تختار اسم مستخدم قبل المشاهدة (يظهر في العلامة المائية)
  if (user && !user.username) {
    const qs = searchParams.ep ? `?ep=${searchParams.ep}` : "";
    redirect(`/choose-username?next=${encodeURIComponent(`/watch/${params.slug}${qs}`)}`);
  }
  const tr = (await getT());
  if (t.comingSoon && user?.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <ClockIcon className="mx-auto h-14 w-14 text-brand" />
        <h1 className="mt-4 text-3xl font-bold">{tr("watch.soonTitle", { name: t.name })}</h1>
        <p className="mt-3 text-neutral-400">{t.releaseLabel ? tr("watch.releaseOn", { date: t.releaseLabel }) : tr("watch.soonText")}</p>
        <Link href={`/title/${t.slug}`} className="btn-ghost mt-6">{tr("watch.details")}</Link>
      </div>
    );
  }
  const ep = t.type === "SERIES" ? t.episodes.find((e) => e.id === searchParams.ep) ?? t.episodes[0] : null;
  if (t.type === "SERIES" && !ep) notFound();

  const allowed = isSubscribed(user) || t.isFree || !!ep?.isFree;

  if (!allowed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <LockIcon className="mx-auto h-14 w-14 text-brand" />
        <h1 className="mt-4 text-3xl font-bold">{tr("watch.lockedTitle")}</h1>
        <p className="mt-3 text-neutral-400">{tr("watch.lockedText", { name: t.name })}</p>
        <Link href={user ? "/pricing" : `/register?next=/pricing`} className="btn-primary mt-6">
          {user ? tr("watch.choosePlan") : tr("watch.createAndSubscribe")}
        </Link>
      </div>
    );
  }

  const key = ep ? ep.id : t.id;
  const progress = user ? await db.watchProgress.findUnique({ where: { userId_key: { userId: user.id, key } } }) : null;
  const idx = ep ? t.episodes.findIndex((e) => e.id === ep.id) : -1;
  const next = idx >= 0 ? t.episodes[idx + 1] : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Player
        key={key}
        format={(ep?.streamFormat ?? t.streamFormat) === "hls" ? "hls" : "file"}
        subtitles={readSubtitles(ep?.subtitles ?? t.subtitles)}
        src={ep ? `/api/stream/episode/${ep.id}` : `/api/stream/title/${t.id}`}
        poster={ep?.thumbUrl || t.backdropUrl || t.posterUrl || undefined}
        progressKey={user ? key : undefined}
        watermark={user ? `${user.username ?? user.email} · ${user.id.slice(-6)}` : undefined}
        startAt={progress?.seconds ?? 0}
        nextHref={next ? `/watch/${t.slug}?ep=${next.id}` : undefined}
      />
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={`/title/${t.slug}`} className="text-sm text-brand">{t.name}</Link>
          <h1 className="text-2xl font-bold">{ep ? tr("watch.episodeHeading", { s: ep.season, e: ep.number, name: ep.name }) : t.name}</h1>
          {ep?.description && <p className="mt-2 max-w-3xl text-neutral-400">{ep.description}</p>}
        </div>
        {next && <Link href={`/watch/${t.slug}?ep=${next.id}`} className="btn-ghost">{tr("watch.next")}<ArrowNextIcon /></Link>}
      </div>
      {t.type === "SERIES" && (
        <div className="no-scrollbar mt-8 flex gap-3 overflow-x-auto pb-2">
          {t.episodes.map((e) => (
            <Link
              key={e.id}
              href={`/watch/${t.slug}?ep=${e.id}`}
              className={`shrink-0 rounded-lg border px-4 py-3 text-sm ${e.id === ep?.id ? "border-brand bg-brand/10" : "border-white/10 hover:bg-white/5"}`}
            >
              {tr("watch.epShort", { s: e.season, e: e.number, name: e.name })}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
