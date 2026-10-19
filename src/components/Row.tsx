import type { Title } from "@prisma/client";
import TitleCard from "./TitleCard";

export default function Row({ title, items }: { title: string; items: Title[] }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
        {items.map((t) => <TitleCard key={t.id} t={t} />)}
      </div>
    </section>
  );
}
