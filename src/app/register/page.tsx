import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { register } from "@/app/actions/auth";
import { getT } from "@/lib/i18n/server";

export default function Register({ searchParams }: { searchParams: { next?: string } }) {
  const t = getT();
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="card">
        <h1 className="mb-6 text-2xl font-bold">{t("auth.registerTitle")}</h1>
        <AuthForm action={register} mode="register" next={searchParams.next} />
        <p className="mt-4 text-sm text-neutral-400">
          {t("auth.haveAccount")} <Link href="/login" className="text-brand">{t("auth.signIn")}</Link>
        </p>
      </div>
    </div>
  );
}
