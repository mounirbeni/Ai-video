import SimpleForm from "@/components/SimpleForm";
import { resetPassword } from "@/app/actions/auth";
import { getT } from "@/lib/i18n/server";

export default function ResetPassword({ searchParams }: { searchParams: { token?: string } }) {
  const t = getT();
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="card">
        <h1 className="mb-6 text-2xl font-bold">{t("auth.resetTitle")}</h1>
        <SimpleForm action={resetPassword} label={t("auth.savePassword")}>
          <input type="hidden" name="token" value={searchParams.token ?? ""} />
          <div><label className="label">{t("auth.newPassword")}</label><input name="password" type="password" className="input" required minLength={8} dir="ltr" /></div>
        </SimpleForm>
      </div>
    </div>
  );
}
