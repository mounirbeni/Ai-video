import Link from "next/link";
import type { Title } from "@prisma/client";
import { getT } from "@/lib/i18n/server";
import { PlayIcon, ClockIcon } from "./Icons";

export default async function TitleCard({ t, layout = "grid" }: { t: Title; layout?: "grid" | "rail" }) {
  const tr = await getT();
  return <Link href={`/title/${t.slug}`} className={`group min-w-0 snap-start rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${layout === "rail" ? "w-[42vw] max-w-[192px] shrink-0 sm:w-48" : "block w-full"}`}>
    <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-neutral-800 shadow-lg transition duration-300 group-hover:-translate-y-1 group-hover:border-white/25 motion-reduce:transform-none">
      {t.posterUrl ? <img src={t.posterUrl} alt={t.name} loading="lazy" decoding="async" width={384} height={576} className="h-full w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transform-none" /> : <div className="flex h-full items-center justify-center p-4 text-center font-bold">{t.name}</div>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/15" />
      {t.isFree && !t.comingSoon && <span className="absolute start-2.5 top-2.5 rounded-md border border-emerald-400/20 bg-emerald-950/90 px-2 py-1 text-[10px] font-bold text-emerald-200 sm:text-xs">{tr("badge.free")}</span>}
      {!t.comingSoon && <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"><span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white backdrop-blur"><PlayIcon className="h-5 w-5" /></span></span>}
      <div className="absolute inset-x-0 bottom-0 p-3">
        {t.comingSoon ? <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-200"><ClockIcon />{t.releaseLabel || tr("badge.soon")}</p> : <p className="text-xs text-white/80">{tr(`type.${t.type as "MOVIE" | "SERIES"}`)}{t.year ? ` · ${t.year}` : ""}</p>}
      </div>
    </div>
    <p className="mt-3 line-clamp-2 text-sm font-bold leading-6 text-neutral-100 transition group-hover:text-brand-cyan">{t.name}</p>
    {t.comingSoon && <p className="mt-0.5 text-xs text-neutral-500">{tr(`type.${t.type as "MOVIE" | "SERIES"}`)}</p>}
  </Link>;
}
