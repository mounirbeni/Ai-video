import { getLocale } from "@/lib/i18n/server";

export default async function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: [string, string][] }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 leading-8">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500">{(await getLocale()) === "ar" ? "آخر تحديث" : "Last updated"}: {updated}</p>
      {sections.map(([h, body]) => (
        <section key={h} className="mt-8">
          <h2 className="mb-2 text-xl font-semibold">{h}</h2>
          <p className="whitespace-pre-line text-neutral-300">{body}</p>
        </section>
      ))}
    </article>
  );
}
