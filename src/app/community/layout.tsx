import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nexora Community", robots: { index: false, follow: false } };

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/community");
  return <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">{children}</div>;
}
