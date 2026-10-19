import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { login } from "@/app/actions/auth";
import { getT } from "@/lib/i18n/server";

export default function Login({ searchParams }: { searchParams: { next?: string } }) {
  const t = getT();
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="card">
        <h1 className="mb-6 text-2xl font-bold">{t("auth.loginTitle")}</h1>
        <AuthForm action={login} mode="login" next={searchParams.next} />
        <p className="mt-4 text-sm text-neutral-400">
          {t("auth.noAccount")} <Link href={`/register${searchParams.next ? `?next=${encodeURIComponent(searchParams.next)}` : ""}`} className="text-brand">{t("auth.createOne")}</Link>
        </p>
      </div>
    </div>
  );
}
