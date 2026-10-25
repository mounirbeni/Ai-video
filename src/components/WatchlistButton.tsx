"use client";

import { useState, useTransition } from "react";
import { setWatchlist } from "@/app/actions/library";
import { useT } from "@/lib/i18n/client";

export default function WatchlistButton({ titleId, saved }: { titleId: string; saved: boolean }) {
  const t = useT();
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  return <div>
    <button type="button" className="btn-ghost" aria-pressed={saved} disabled={pending} onClick={() => {
      setError(false);
      start(async () => {
        try { await setWatchlist(titleId, !saved); } catch { setError(true); }
      });
    }}>{pending ? "…" : saved ? t("list.remove") : t("list.add")}</button>
    {error && <p role="alert" className="mt-2 text-sm text-red-400">{t("list.error")}</p>}
  </div>;
}
