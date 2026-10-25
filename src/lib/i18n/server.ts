import { cookies } from "next/headers";
import { translate, type Key, type Locale } from "./dict";

export const LOCALE_COOKIE = "lang";

// الإنجليزية افتراضية؛ العربية فقط إن اختارها الزائر
export async function getLocale(): Promise<Locale> {
  return (await cookies()).get(LOCALE_COOKIE)?.value === "ar" ? "ar" : "en";
}

export async function getT() {
  const locale = await getLocale();
  const t = (key: Key, vars?: Record<string, string | number>) => translate(locale, key, vars);
  return Object.assign(t, { locale, dir: locale === "ar" ? "rtl" : "ltr" } as const);
}
