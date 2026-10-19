"use client";

import { createContext, useContext } from "react";
import { translate, type Key, type Locale } from "./dict";

const Ctx = createContext<Locale>("en");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <Ctx.Provider value={locale}>{children}</Ctx.Provider>;
}

export function useT() {
  const locale = useContext(Ctx);
  const t = (key: Key, vars?: Record<string, string | number>) => translate(locale, key, vars);
  return Object.assign(t, { locale });
}
