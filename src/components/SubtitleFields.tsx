import { getT } from "@/lib/i18n/server";
import { formatSubtitles } from "@/lib/subtitles";

export default async function SubtitleFields({ subtitles, streamFormat = "file" }: { subtitles?: unknown; streamFormat?: string }) {
  const t = await getT();
  return <div className="space-y-3">
    <label className="label">{t("form.streamFormat")}
      <select name="streamFormat" defaultValue={streamFormat} className="input mt-1"><option value="file">{t("form.file")}</option><option value="hls">{t("form.hls")}</option></select>
    </label>
    <label className="label">{t("form.subtitles")}
      <textarea name="subtitles" defaultValue={formatSubtitles(subtitles)} className="input mt-1 min-h-24" dir="ltr" />
    </label>
    <p className="text-xs text-neutral-400">{t("form.subtitleHint")}</p>
  </div>;
}
