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
      <div className="md:col-span-2"><label className="label">{tr("form.name")}</label><input name="name" defaultValue={t?.name} className="input" required /></div>
      <div className="md:col-span-2"><label className="label">{tr("form.description")}</label><textarea name="description" defaultValue={t?.description} className="input min-h-28" required /></div>
      <div><label className="label">{tr("form.year")}</label><input name="year" type="number" defaultValue={t?.year ?? ""} className="input" /></div>
      {(isNew || t?.type === "MOVIE") && (
        <div><label className="label">{tr(isNew ? "form.durationMovie" : "form.duration")}</label><input name="duration" type="number" min={1} defaultValue={t?.duration ?? ""} className="input" /></div>
      )}
      {(isNew || t?.type === "SERIES") && (
        <div><label className="label">{tr(isNew ? "form.episodesSeries" : "form.episodes")}</label><input name="plannedEpisodes" type="number" min={1} defaultValue={t?.plannedEpisodes ?? ""} className="input" placeholder={tr("form.episodesHint")} /></div>
      )}
      <div className="md:col-span-2"><label className="label">{tr("form.genres")}</label><input name="genres" defaultValue={t?.genres} className="input" placeholder={tr("form.genresPlaceholder")} /></div>
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
        <input name="releaseLabel" defaultValue={t?.releaseLabel ?? ""} className="input w-56 py-1.5" placeholder={tr("form.releasePlaceholder")} />
      </div>
      <div className="md:col-span-2"><button className="btn-primary">{isNew ? tr("form.create") : tr("form.save")}</button></div>
    </form>
  );
}
