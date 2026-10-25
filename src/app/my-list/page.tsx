import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { localizeTitle } from "@/lib/i18n/localize";
import TitleCard from "@/components/TitleCard";
import WatchlistButton from "@/components/WatchlistButton";

export default async function MyList() {
  const user = await requireUser("/my-list");
  const t = await getT();
  const entries = await db.watchlist.findMany({ where: { userId: user.id, title: { published: true } }, include: { title: true }, orderBy: { createdAt: "desc" } });
  return <section className="mx-auto max-w-7xl px-4 py-10">
    <h1 className="mb-6 text-3xl font-bold">{t("list.title")}</h1>
    {entries.length ? <div className="flex flex-wrap gap-5">{entries.map(({ title }) => <div key={title.id} className="flex w-40 flex-col gap-3 sm:w-48">
      <TitleCard t={localizeTitle(title, t.locale)} />
      <WatchlistButton titleId={title.id} saved />
    </div>)}</div> : <div className="card"><p>{t("list.empty")}</p><Link href="/browse" className="btn-primary mt-4">{t("list.browse")}</Link></div>}
  </section>;
}
