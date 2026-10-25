import Link from "next/link";
import type { Title } from "@prisma/client";
import { getT } from "@/lib/i18n/server";

export default async function TitleCard({ t }: { t: Title }) {
  const tr = (await getT());
  return (
    <Link href={`/title/${t.slug}`} className="group w-40 shrink-0 sm:w-48">
      <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-neutral-800">
        {t.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.posterUrl} alt={t.name} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center font-bold">{t.name}</div>
        )}
        <span className="absolute start-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs">
          {tr(`type.${t.type as "MOVIE" | "SERIES"}`)}
        </span>
        {t.comingSoon && (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-6 text-center text-xs font-bold text-amber-300">
            {tr("badge.soon")}{t.releaseLabel && ` · ${t.releaseLabel}`}
          </span>
        )}
        {t.isFree && !t.comingSoon && <span className="absolute end-2 top-2 rounded bg-green-600 px-2 py-0.5 text-xs">{tr("badge.free")}</span>}
      </div>
      <p className="mt-2 truncate text-sm font-semibold group-hover:text-brand">{t.name}</p>
    </Link>
  );
}
