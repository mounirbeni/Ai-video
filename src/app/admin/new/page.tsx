import TitleForm from "@/components/TitleForm";
import { createTitle } from "@/app/actions/admin";
import { getT } from "@/lib/i18n/server";

export default async function NewTitle() {
  const t = (await getT());
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{t("admin.newTitle")}</h1>
      <TitleForm action={createTitle} />
    </div>
  );
}
