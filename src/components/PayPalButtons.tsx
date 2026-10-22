"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { CheckCircleIcon } from "./Icons";

type PayPalSDK = { Buttons: (o: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void>; close?: () => void } };

export default function PayPalButtons({ clientId, item }: { clientId: string; item: string }) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "done" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const render = () => {
      const pp = (window as unknown as { paypal?: PayPalSDK }).paypal;
      if (!pp || !box.current || cancelled) return;
      box.current.innerHTML = "";
      pp.Buttons({
        style: { layout: "vertical", color: "gold", shape: "rect", label: "pay", height: 48 },
        createOrder: async () => {
          const r = await fetch("/api/paypal/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item }) });
          const d = await r.json();
          if (!d.id) throw new Error("order");
          return d.id;
        },
        onApprove: async (data: { orderID: string }) => {
          const r = await fetch("/api/paypal/capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderID: data.orderID }) });
          if (r.ok) {
            setState("done");
            setTimeout(() => (window.location.href = "/account?success=1"), 1500);
          } else setState("error");
        },
        onError: () => setState("error"),
      })
        .render(box.current)
        .then(() => !cancelled && setState("ready"))
        .catch(() => !cancelled && setState("error"));
    };
    const src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons&enable-funding=card`;
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if ((window as unknown as { paypal?: unknown }).paypal) render();
      else existing.addEventListener("load", render);
    } else {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = render;
      s.onerror = () => setState("error");
      document.body.appendChild(s);
    }
    return () => { cancelled = true; };
  }, [clientId, item]);

  if (state === "done") {
    return (
      <div className="card text-center">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
        <p className="mt-3 text-green-300">{t("pay.ppDone")}</p>
      </div>
    );
  }
  return (
    <div>
      {state === "loading" && <div className="h-28 animate-pulse rounded-xl bg-white/5" />}
      <div ref={box} className="rounded-xl bg-white p-3 empty:hidden" />
      {state === "error" && <p className="mt-3 text-center text-sm text-red-400">{t("pay.ppError")}</p>}
      <p className="mt-3 text-center text-xs text-neutral-500">{t("pay.ppNote")}</p>
    </div>
  );
}
