import { requireUser } from "@/lib/auth";
import { redeemCode } from "@/app/actions/payments";
import SimpleForm from "@/components/SimpleForm";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function Redeem() {
  await requireUser("/redeem");
  const t = getT();
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <h1 className="mb-6 text-2xl font-bold">{t("pay.redeemTitle")}</h1>
        <SimpleForm action={redeemCode} label={t("pay.redeem")}>
          <div>
            <label className="label">{t("pay.code")}</label>
            <input name="code" required placeholder="NX-XXXX-XXXX-XXXX" className="input uppercase tracking-widest" dir="ltr" autoComplete="off" />
          </div>
        </SimpleForm>
      </div>
    </div>
  );
}
