import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "منصتي — أفلام ومسلسلات أصلية",
  description: "شاهد أفلامي ومسلسلاتي الحصرية باشتراك مدفوع",
  applicationName: "منصتي",
  appleWebApp: { capable: true, title: "منصتي", statusBarStyle: "black-translucent" },
  icons: { apple: "/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+64px)] sm:pb-0">
        <Header />
        <main>{children}</main>
        <Suspense>
          <BottomNav />
        </Suspense>
        <InstallPrompt />
        <footer className="mt-20 border-t border-white/10 py-8 text-center text-sm text-neutral-500">
          <div className="mb-2 flex justify-center gap-5">
            <a href="/terms" className="hover:text-white">شروط الاستخدام</a>
            <a href="/privacy" className="hover:text-white">سياسة الخصوصية</a>
            <a href="/pricing" className="hover:text-white">الأسعار</a>
          </div>
          © {new Date().getFullYear()} منصتي — جميع الحقوق محفوظة
        </footer>
      </body>
    </html>
  );
}
