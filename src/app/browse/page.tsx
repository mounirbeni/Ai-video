import { db } from "@/lib/db";
import TitleCard from "@/components/TitleCard";

export const dynamic = "force-dynamic";

export default async function Browse({ searchParams }: { searchParams: { type?: string; q?: string } }) {
  const type = searchParams.type === "MOVIE" || searchParams.type === "SERIES" ? searchParams.type : undefined;
  const q = searchParams.q?.trim();
  const items = await db.title.findMany({
    where: {
      published: true,
      ...(type && { type }),
      ...(q && { OR: [{ name: { contains: q } }, { description: { contains: q } }, { genres: { contains: q } }] }),
    },
    orderBy: { createdAt: "desc" },
  });
  const heading = q ? `نتائج البحث: ${q}` : type === "MOVIE" ? "الأفلام" : type === "SERIES" ? "المسلسلات" : "كل المحتوى";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <form action="/browse" className="mb-6 md:hidden">
        {type && <input type="hidden" name="type" value={type} />}
        <input name="q" defaultValue={q} placeholder="ابحث عن فيلم أو مسلسل…" className="input" type="search" />
      </form>
      <h1 className="mb-8 text-3xl font-bold">{heading}</h1>
      {items.length ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((t) => <TitleCard key={t.id} t={t} />)}
        </div>
      ) : (
        <p className="text-neutral-400">لا توجد نتائج.</p>
      )}
    </div>
  );
}
