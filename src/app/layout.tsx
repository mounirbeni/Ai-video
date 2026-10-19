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
          © {new Date().getFullYear()} منصتي — جميع الحقوق محفوظة
        </footer>
      </body>
    </html>
  );
}
