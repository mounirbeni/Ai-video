import type { Title } from "@prisma/client";
import UploadField from "./UploadField";

export default function TitleForm({ action, t }: { action: (f: FormData) => void; t?: Title }) {
  const isNew = !t;
  return (
    <form action={action} className="card grid gap-4 md:grid-cols-2">
      {isNew && (
        <div className="md:col-span-2">
          <label className="label">النوع</label>
          <select name="type" className="input">
            <option value="MOVIE">فيلم</option>
            <option value="SERIES">مسلسل</option>
          </select>
        </div>
      )}
      <div className="md:col-span-2"><label className="label">الاسم</label><input name="name" defaultValue={t?.name} className="input" required /></div>
      <div className="md:col-span-2"><label className="label">الوصف</label><textarea name="description" defaultValue={t?.description} className="input min-h-28" required /></div>
      <div><label className="label">سنة الإنتاج</label><input name="year" type="number" defaultValue={t?.year ?? ""} className="input" /></div>
      <div><label className="label">المدة (دقائق)</label><input name="duration" type="number" defaultValue={t?.duration ?? ""} className="input" /></div>
      <div className="md:col-span-2"><label className="label">التصنيفات (مفصولة بفواصل)</label><input name="genres" defaultValue={t?.genres} className="input" placeholder="دراما, خيال علمي" /></div>
      <UploadField name="posterUrl" label="الملصق (عمودي)" kind="image" defaultValue={t?.posterUrl} />
      <UploadField name="backdropUrl" label="الخلفية (أفقية)" kind="image" defaultValue={t?.backdropUrl} />
      <div className="md:col-span-2"><label className="label">رابط الإعلان التشويقي</label><input name="trailerUrl" defaultValue={t?.trailerUrl ?? ""} className="input" dir="ltr" /></div>
      {(isNew || t?.type === "MOVIE") && (
        <div className="md:col-span-2">
          <UploadField name="videoSrc" label="ملف الفيلم" kind="video" defaultValue={t?.videoSrc} hint="للأفلام فقط — المسلسلات تُضاف حلقاتها بعد الحفظ." />
        </div>
      )}
      <div className="flex flex-wrap gap-6 md:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={t?.published ?? true} /> منشور</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={t?.featured} /> مميز في الواجهة</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="isFree" defaultChecked={t?.isFree} /> مجاني للجميع</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="comingSoon" defaultChecked={t?.comingSoon} /> قريبًا (يُعرض دون مشاهدة)</label>
        <input name="releaseLabel" defaultValue={t?.releaseLabel ?? ""} className="input w-56 py-1.5" placeholder="موعد العرض، مثل: ديسمبر 2026" />
      </div>
      <div className="md:col-span-2"><button className="btn-primary">{isNew ? "إنشاء" : "حفظ التعديلات"}</button></div>
    </form>
  );
}
