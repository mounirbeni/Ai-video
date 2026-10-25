"use client";

import UserAvatar from "./UserAvatar";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Key } from "@/lib/i18n/dict";
import { useT } from "@/lib/i18n/client";
import type { AccountIdentity } from "@/lib/identity";
import { identityLabelKey } from "@/lib/identity";
import { IdentityMark } from "./IdentityBadge";

const ITEMS: { href: string; label: Key; icon: string; match: (path: string, type: string | null) => boolean }[] = [
  { href: "/", label: "nav.home", icon: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z", match: (p: string) => p === "/" },
  { href: "/browse?type=MOVIE", label: "nav.movies", icon: "M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4", match: (p: string, t: string | null) => p === "/browse" && t === "MOVIE" },
  { href: "/browse?type=SERIES", label: "nav.series", icon: "M3 6h18v12H3zM8 21h8M12 18v3", match: (p: string, t: string | null) => p === "/browse" && t === "SERIES" },
  { href: "/my-list", label: "list.title", icon: "M6 3h12v18l-6-4-6 4V3z", match: (p: string) => p === "/my-list" },
  { href: "/account", label: "nav.account", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0", match: (p: string) => p.startsWith("/account") || p === "/login" || p === "/register" },
];

// شريط تنقّل سفلي على الهاتف، مثل التطبيقات
export default function BottomNav({ avatarId = null, name = "", role = "USER", identity = null }: { avatarId?: string | null; name?: string; role?: string; identity?: AccountIdentity }) {
  const path = usePathname();
  const type = useSearchParams().get("type");
  const t = useT();
  if (path.startsWith("/watch") || path.startsWith("/admin")) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-neutral-950/95 backdrop-blur sm:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <ul className="grid grid-cols-5">
        {ITEMS.map((it) => {
          const active = it.match(path, type);
          return (
            <li key={it.label}>
              <Link href={it.href} aria-label={it.href === "/account" && identity ? `${t(it.label)} · ${t(identityLabelKey(identity))}` : undefined} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-1 py-2 text-[11px] ${active ? "text-brand" : "text-neutral-400"}`}>
                {it.href === "/account" && (avatarId || identity) ? <span className="relative"><UserAvatar role={role} identity={identity} avatarId={avatarId} name={name} decorative className="h-6 w-6" />{identity && <span aria-hidden="true" className={`absolute -end-1 -bottom-0.5 rounded-full bg-neutral-950 p-0.5 ${identity === "admin" ? "text-amber-200" : "text-cyan-200"}`}><IdentityMark identity={identity} className="h-2.5 w-2.5" /></span>}</span> : <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={it.icon} /></svg>}
                {it.href === "/account" && identity ? <span className={identity === "admin" ? "text-amber-200" : "text-cyan-200"}>{t(identity === "admin" ? "identity.adminShort" : "identity.developerShort")}</span> : t(it.label)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
