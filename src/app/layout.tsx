import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "منصتي — أفلام ومسلسلات أصلية",
  description: "شاهد أفلامي ومسلسلاتي الحصرية باشتراك مدفوع",
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
      <body className="min-h-screen">
        <Header />
        <main>{children}</main>
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
