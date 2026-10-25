import Link from "next/link";
import type { Title } from "@prisma/client";
import { getT } from "@/lib/i18n/server";
import { ArrowNextIcon } from "./Icons";
import ContentRail from "./ContentRail";
import TitleCard from "./TitleCard";

export default async function Row({ title, items, description, href, id }: { title: string; items: Title[]; description?: string; href?: string; id?: string }) {
  if (!items.length) return null;
  const t = await getT();
  return <section id={id} className="mx-auto max-w-7xl scroll-mt-28 px-4 py-7 sm:px-6 sm:py-9">
    <div className="mb-4 flex items-start justify-between gap-4">
      <div><h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>{description && <p className="mt-1.5 text-sm text-neutral-400">{description}</p>}</div>
      {href && <Link href={href} className="inline-flex shrink-0 items-center gap-1.5 rounded-md py-1 text-xs font-semibold text-neutral-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand sm:text-sm">{t("home.viewAll")}<ArrowNextIcon /></Link>}
    </div>
    <ContentRail title={title}>{items.map((t) => <TitleCard key={t.id} t={t} layout="rail" />)}</ContentRail>
  </section>;
}
