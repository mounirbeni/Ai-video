"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { ShareIcon } from "./Icons";

// Shares the canonical page URL (which carries the rich preview) via the native share sheet, or copies it.
export default function ShareButton({ path, title, text }: { path: string; title: string; text?: string }) {
  const t = useT();
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return; // user closed the share sheet
      setStatus("error");
    }
  }

  return (
    <div>
      <button type="button" className="btn-ghost" onClick={share}>
        <ShareIcon />
        {status === "copied" ? t("share.copied") : t("share.button")}
      </button>
      <span role="status" className="sr-only">{status === "copied" ? t("share.copied") : ""}</span>
      {status === "error" && <p role="alert" className="mt-2 text-sm text-red-400">{t("share.failed")}</p>}
    </div>
  );
}
