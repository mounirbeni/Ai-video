import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default function NotFound() {
  const t = getT();
  return (
    <div className="py-32 text-center">
      <h1 className="text-5xl font-extrabold">404</h1>
      <p className="mt-3 text-neutral-400">{t("notFound.text")}</p>
      <Link href="/" className="btn-primary mt-6">{t("notFound.home")}</Link>
    </div>
  );
}
