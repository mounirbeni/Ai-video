"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";

type PaddleJs = {
  Environment: { set: (env: string) => void };
  Initialize: (o: { token: string }) => void;
  Checkout: { open: (o: unknown) => void };
};
declare global {
  interface Window { Paddle?: PaddleJs; __paddleReady?: boolean }
}

function loadPaddle(token: string, env: string) {
  return new Promise<PaddleJs>((resolve, reject) => {
    if (window.Paddle && window.__paddleReady) return resolve(window.Paddle);
    const s = document.createElement("script");
    s.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    s.onload = () => {
      if (env === "sandbox") window.Paddle!.Environment.set("sandbox");
      window.Paddle!.Initialize({ token });
      window.__paddleReady = true;
      resolve(window.Paddle!);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export default function PaddleCheckout({
  priceId, token, env, email, userId,
}: { priceId: string; token: string; env: string; email: string; userId: string }) {
  const [busy, setBusy] = useState(false);
  const t = useT();
  useEffect(() => { loadPaddle(token, env).catch(() => {}); }, [token, env]);

  async function open() {
    setBusy(true);
    try {
      const P = await loadPaddle(token, env);
      P.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: { email },
        customData: { userId },
        settings: { displayMode: "overlay", locale: t.locale, successUrl: `${location.origin}/account?success=1` },
      });
    } finally {
      setBusy(false);
    }
  }

  return <button type="button" onClick={open} disabled={busy} className="btn-primary w-full">{t("pricing.subscribe")}</button>;
}
