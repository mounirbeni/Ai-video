"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";

type BIP = Event & { prompt: () => Promise<void> };

// يسجّل عامل الخدمة، ويعرض اقتراح «تثبيت التطبيق» على الهاتف مرة حتى يُغلق
export default function InstallPrompt() {
  const [evt, setEvt] = useState<BIP | null>(null);
  const [ios, setIos] = useState(false);
  const t = useT();

  useEffect(() => {
    navigator.serviceWorker?.register("/sw.js").catch(() => {});
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    let dismissed = false;
    try { dismissed = localStorage.getItem("install-dismissed") === "1"; } catch {}
    if (standalone || dismissed) return;
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIP); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setIos(true);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const close = () => {
    setEvt(null);
    setIos(false);
    try { localStorage.setItem("install-dismissed", "1"); } catch {}
  };
  if (!evt && !ios) return null;

  return (
    <div className="fixed inset-x-3 z-50 flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-900 p-3 shadow-2xl sm:hidden" style={{ bottom: "calc(env(safe-area-inset-bottom) + 72px)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon-192.png" alt="" className="h-10 w-10 rounded-lg" />
      <p className="flex-1 text-sm">
        {evt ? t("install.prompt") : (() => { const [a, rest] = t("install.ios").split("{share}"); const [b, c] = rest.split("{add}"); return <>{a}<b>{t("install.share")}</b>{b}<b>{t("install.add")}</b>{c}</>; })()}
      </p>
      {evt && (
        <button className="btn-primary px-3 py-1.5 text-sm" onClick={() => evt.prompt().finally(close)}>{t("install.button")}</button>
      )}
      <button aria-label={t("install.close")} className="px-1 text-neutral-400" onClick={close}>✕</button>
    </div>
  );
}
