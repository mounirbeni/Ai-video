import type { Locale } from "./dict";

// يختار نسخة اللغة المطلوبة، ويعود للأخرى إن كانت فارغة
const pick = (main: string | null | undefined, ar: string | null | undefined, locale: Locale) =>
  (locale === "ar" ? ar || main : main || ar) ?? "";

type Localizable = { name: string; description: string; nameAr?: string | null; descriptionAr?: string | null };

export function localizeEpisode<E extends Localizable>(e: E, locale: Locale): E {
  return { ...e, name: pick(e.name, e.nameAr, locale), description: pick(e.description, e.descriptionAr, locale) };
}

export function localizeTitle<
  T extends Localizable & { genres: string; genresAr?: string | null; releaseLabel?: string | null; releaseLabelAr?: string | null; episodes?: Localizable[] },
>(t: T, locale: Locale): T {
  return {
    ...localizeEpisode(t, locale),
    genres: pick(t.genres, t.genresAr, locale),
    releaseLabel: pick(t.releaseLabel, t.releaseLabelAr, locale) || null,
    ...(t.episodes && { episodes: t.episodes.map((e) => localizeEpisode(e, locale)) }),
  };
}
