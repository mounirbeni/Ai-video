import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import TitleForm from "@/components/TitleForm";
import UploadField from "@/components/UploadField";
import { addEpisode, deleteEpisode, deleteTitle, updateTitle } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function EditTitle({ params, searchParams }: { params: { id: string }; searchParams: { saved?: string } }) {
  const t = await db.title.findUnique({
    where: { id: params.id },
    include: { episodes: { orderBy: [{ season: "asc" }, { number: "asc" }] } },
  });
  if (!t) notFound();
  const lastSeason = t.episodes.at(-1)?.season ?? 1;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">تعديل: {t.name}</h1>
        <form action={deleteTitle.bind(null, t.id)}>
          <button className="text-sm text-red-400 hover:text-red-300">حذف العمل نهائيًا</button>
        </form>
      </div>
      {searchParams.saved && <p className="rounded-md bg-green-500/10 p-3 text-green-300">تم الحفظ.</p>}
      <TitleForm action={updateTitle.bind(null, t.id)} t={t} />

      {t.type === "SERIES" && (
        <section>
          <h2 className="mb-4 text-xl font-bold">الحلقات ({t.episodes.length})</h2>
          <div className="mb-6 divide-y divide-white/5 rounded-xl border border-white/10">
            {t.episodes.map((e) => (
              <div key={e.id} className="flex items-center gap-4 p-3 text-sm">
                <span className="text-neutral-400">م{e.season} ح{e.number}</span>
                <span className="flex-1 font-semibold">{e.name}</span>
                {e.isFree && <span className="text-green-400">مجانية</span>}
                <form action={deleteEpisode.bind(null, e.id)}><button className="text-red-400">حذف</button></form>
              </div>
            ))}
            {!t.episodes.length && <p className="p-4 text-neutral-400">لا توجد حلقات بعد.</p>}
          </div>

          <form action={addEpisode.bind(null, t.id)} className="card grid gap-4 md:grid-cols-4">
            <h3 className="font-bold md:col-span-4">إضافة حلقة (رقم موجود = تحديثها)</h3>
            <div><label className="label">الموسم</label><input name="season" type="number" defaultValue={lastSeason} min={1} className="input" /></div>
            <div><label className="label">رقم الحلقة</label><input name="number" type="number" min={1} className="input" placeholder="تلقائي" /></div>
            <div className="md:col-span-2"><label className="label">عنوان الحلقة</label><input name="name" className="input" required /></div>
            <div className="md:col-span-4"><label className="label">الوصف</label><textarea name="description" className="input" /></div>
            <div className="md:col-span-3"><UploadField name="videoSrc" label="ملف الحلقة" kind="video" required /></div>
            <div><label className="label">المدة (دقائق)</label><input name="duration" type="number" className="input" /></div>
            <label className="flex items-center gap-2 md:col-span-4"><input type="checkbox" name="isFree" /> حلقة مجانية (للتجربة)</label>
            <div className="md:col-span-4"><button className="btn-primary">إضافة الحلقة</button></div>
          </form>
        </section>
      )}
    </div>
  );
}
