import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import { I18nProvider } from "@/lib/i18n/client";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = (await getT());
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const t = (await getT());
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
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
