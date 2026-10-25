import { db } from "@/lib/db";
import TitleCard from "@/components/TitleCard";
import { getT } from "@/lib/i18n/server";
import { localizeTitle } from "@/lib/i18n/localize";

export const dynamic = "force-dynamic";

export default async function Browse({ searchParams: searchParamsPromise }: { searchParams: Promise<{ type?: string; q?: string; status?: string }> }) {
  const searchParams = await searchParamsPromise;

  const type = searchParams.type === "MOVIE" || searchParams.type === "SERIES" ? searchParams.type : undefined;
  const q = searchParams.q?.trim();
  const status = ["available", "soon", "free"].includes(searchParams.status ?? "") ? searchParams.status : undefined;
  const items = await db.title.findMany({
    where: {
      published: true,
      ...(type && { type }),
      ...(status && { comingSoon: status === "soon" }),
      ...(status === "free" && { isFree: true }),
      ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { nameAr: { contains: q } }, { description: { contains: q, mode: "insensitive" } }, { descriptionAr: { contains: q } }, { genres: { contains: q, mode: "insensitive" } }, { genresAr: { contains: q } }] }),
    },
    orderBy: { createdAt: "desc" },
  });
  const t = (await getT());
  const heading = q ? t("browse.results", { q }) : status === "soon" ? t("row.soon") : status === "free" ? t("row.free") : type === "MOVIE" ? t("row.movies") : type === "SERIES" ? t("row.series") : t("browse.all");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <form action="/browse" className="mb-6 md:hidden">
        {type && <input type="hidden" name="type" value={type} />}
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder={t("browse.placeholder")} className="input" type="search" />
      </form>
      <h1 className="mb-8 text-3xl font-bold">{heading}</h1>
      {items.length ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((it) => <TitleCard key={it.id} t={localizeTitle(it, t.locale)} />)}
        </div>
      ) : (
        <p className="text-neutral-400">{t("browse.none")}</p>
      )}
    </div>
  );
}
