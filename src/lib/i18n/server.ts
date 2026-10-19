import { cookies } from "next/headers";
import { translate, type Key, type Locale } from "./dict";

export const LOCALE_COOKIE = "lang";

// الإنجليزية افتراضية؛ العربية فقط إن اختارها الزائر
export function getLocale(): Locale {
  return cookies().get(LOCALE_COOKIE)?.value === "ar" ? "ar" : "en";
}

export function getT() {
  const locale = getLocale();
  const t = (key: Key, vars?: Record<string, string | number>) => translate(locale, key, vars);
  return Object.assign(t, { locale, dir: locale === "ar" ? "rtl" : "ltr" } as const);
}
