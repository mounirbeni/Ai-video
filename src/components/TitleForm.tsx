import type { Title } from "@prisma/client";
import UploadField from "./UploadField";
import { getT } from "@/lib/i18n/server";

export default function TitleForm({ action, t }: { action: (f: FormData) => void; t?: Title }) {
  const tr = getT();
  const isNew = !t;
  return (
    <form action={action} className="card grid gap-4 md:grid-cols-2">
      {isNew && (
        <div className="md:col-span-2">
          <label className="label">{tr("form.type")}</label>
          <select name="type" className="input">
            <option value="MOVIE">{tr("type.MOVIE")}</option>
            <option value="SERIES">{tr("type.SERIES")}</option>
          </select>
        </div>
      )}
      <div><label className="label">{tr("form.name")} (English)</label><input name="name" defaultValue={t?.name} className="input" dir="ltr" required /></div>
      <div><label className="label">{tr("form.name")} (العربية)</label><input name="nameAr" defaultValue={t?.nameAr ?? ""} className="input" dir="rtl" /></div>
      <div><label className="label">{tr("form.description")} (English)</label><textarea name="description" defaultValue={t?.description} className="input min-h-28" dir="ltr" required /></div>
      <div><label className="label">{tr("form.description")} (العربية)</label><textarea name="descriptionAr" defaultValue={t?.descriptionAr ?? ""} className="input min-h-28" dir="rtl" /></div>
      <div><label className="label">{tr("form.year")}</label><input name="year" type="number" defaultValue={t?.year ?? ""} className="input" /></div>
      {(isNew || t?.type === "MOVIE") && (
        <div><label className="label">{tr(isNew ? "form.durationMovie" : "form.duration")}</label><input name="duration" type="number" min={1} defaultValue={t?.duration ?? ""} className="input" /></div>
      )}
      {(isNew || t?.type === "SERIES") && (
        <div><label className="label">{tr(isNew ? "form.episodesSeries" : "form.episodes")}</label><input name="plannedEpisodes" type="number" min={1} defaultValue={t?.plannedEpisodes ?? ""} className="input" placeholder={tr("form.episodesHint")} /></div>
      )}
      <div><label className="label">{tr("form.genres")} (English)</label><input name="genres" defaultValue={t?.genres} className="input" dir="ltr" placeholder="Drama, Thriller" /></div>
      <div><label className="label">{tr("form.genres")} (العربية)</label><input name="genresAr" defaultValue={t?.genresAr ?? ""} className="input" dir="rtl" placeholder="دراما, تشويق" /></div>
      <UploadField name="posterUrl" label={tr("form.poster")} kind="image" defaultValue={t?.posterUrl} />
      <UploadField name="backdropUrl" label={tr("form.backdrop")} kind="image" defaultValue={t?.backdropUrl} />
      <div className="md:col-span-2"><label className="label">{tr("form.trailer")}</label><input name="trailerUrl" defaultValue={t?.trailerUrl ?? ""} className="input" dir="ltr" /></div>
      {(isNew || t?.type === "MOVIE") && (
        <div className="md:col-span-2">
          <UploadField name="videoSrc" label={tr("form.video")} kind="video" defaultValue={t?.videoSrc} hint={tr("form.videoHint")} />
        </div>
      )}
      <div className="flex flex-wrap gap-6 md:col-span-2">
        <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={t?.published ?? true} /> {tr("form.published")}</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={t?.featured} /> {tr("form.featured")}</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="isFree" defaultChecked={t?.isFree} /> {tr("form.free")}</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="comingSoon" defaultChecked={t?.comingSoon} /> {tr("form.soon")}</label>
        <input name="releaseLabel" defaultValue={t?.releaseLabel ?? ""} className="input w-56 py-1.5" dir="ltr" placeholder="December 2026" />
        <input name="releaseLabelAr" defaultValue={t?.releaseLabelAr ?? ""} className="input w-56 py-1.5" dir="rtl" placeholder="ديسمبر 2026" />
      </div>
      <div className="md:col-span-2"><button className="btn-primary">{isNew ? tr("form.create") : tr("form.save")}</button></div>
    </form>
  );
}
