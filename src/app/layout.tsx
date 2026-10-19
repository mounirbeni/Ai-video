import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import LangSwitch from "@/components/LangSwitch";
import { I18nProvider } from "@/lib/i18n/client";
import { getT } from "@/lib/i18n/server";

export function generateMetadata(): Metadata {
  const t = getT();
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    applicationName: t("brand"),
    appleWebApp: { capable: true, title: t("brand"), statusBarStyle: "black-translucent" },
    icons: { apple: "/apple-touch-icon.png" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#03040c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const t = getT();
  return (
    <html lang={t.locale} dir={t.dir}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Michroma&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+64px)] sm:pb-0">
        <I18nProvider locale={t.locale}>
          <Header />
          <main>{children}</main>
          <Suspense>
            <BottomNav />
          </Suspense>
          <InstallPrompt />
          <footer className="mt-20 border-t border-white/10 py-8 text-center text-sm text-neutral-500">
            <div className="mb-2 flex flex-wrap justify-center gap-5">
              <a href="/terms" className="hover:text-white">{t("footer.terms")}</a>
              <a href="/privacy" className="hover:text-white">{t("footer.privacy")}</a>
              <a href="/pricing" className="hover:text-white">{t("footer.pricing")}</a>
              <Suspense>
                <LangSwitch className="hover:text-white" />
              </Suspense>
            </div>
            <p className="mb-1 font-logo text-xs tracking-[0.3em] text-neutral-400">{t("tagline").toUpperCase()}</p>
            © {new Date().getFullYear()} {t("brand")} — {t("footer.rights")}
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
