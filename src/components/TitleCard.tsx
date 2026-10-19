import Link from "next/link";
import type { Title } from "@prisma/client";

export default function TitleCard({ t }: { t: Title }) {
  return (
    <Link href={`/title/${t.slug}`} className="group w-40 shrink-0 sm:w-48">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-neutral-800">
        {t.posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.posterUrl} alt={t.name} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center p-3 text-center font-bold">{t.name}</div>
        )}
        <span className="absolute start-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs">
          {t.type === "SERIES" ? "مسلسل" : "فيلم"}
        </span>
        {t.isFree && <span className="absolute end-2 top-2 rounded bg-green-600 px-2 py-0.5 text-xs">مجاني</span>}
      </div>
      <p className="mt-2 truncate text-sm font-semibold group-hover:text-brand">{t.name}</p>
    </Link>
  );
}
