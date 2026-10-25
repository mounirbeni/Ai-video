import SimpleForm from "@/components/SimpleForm";
import { forgotPassword } from "@/app/actions/auth";
import { getT } from "@/lib/i18n/server";

export default async function ForgotPassword() {
  const t = (await getT());
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="card">
        <h1 className="mb-2 text-2xl font-bold">{t("auth.forgotTitle")}</h1>
        <p className="mb-6 text-sm text-neutral-400">{t("auth.forgotText")}</p>
        <SimpleForm action={forgotPassword} label={t("auth.sendLink")}>
          <div><label className="label">{t("auth.email")}</label><input name="email" type="email" className="input" required dir="ltr" /></div>
        </SimpleForm>
      </div>
    </div>
  );
}
