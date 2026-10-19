import { NextResponse } from "next/server";
import { LOCALE_COOKIE } from "@/lib/i18n/server";

// تبديل اللغة: /lang?l=ar&next=/path
export function GET(req: Request) {
  const url = new URL(req.url);
  const l = url.searchParams.get("l") === "ar" ? "ar" : "en";
  const n = url.searchParams.get("next") || "/";
  const next = n.startsWith("/") && !n.startsWith("//") ? n : "/";
  const res = NextResponse.redirect(new URL(next, url.origin));
  res.cookies.set(LOCALE_COOKIE, l, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return res;
}
