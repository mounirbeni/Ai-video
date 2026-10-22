import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { chooseUsername } from "@/app/actions/auth";
import SimpleForm from "@/components/SimpleForm";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function ChooseUsername({ searchParams }: { searchParams: { next?: string } }) {
  const user = await requireUser("/choose-username");
  const next = searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//") ? searchParams.next : "/";
  if (user.username) redirect(next);
  const t = getT();
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card">
        <h1 className="text-2xl font-bold">{t("username.title")}</h1>
        <p className="mb-6 mt-2 text-sm text-neutral-400">{t("username.text")}</p>
        <SimpleForm action={chooseUsername} label={t("username.save")}>
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="label">{t("auth.username")}</label>
            <input name="username" required minLength={6} maxLength={6} pattern="\p{L}{6}" autoComplete="username" className="input" dir="auto" />
            <p className="mt-1 text-xs text-neutral-500">{t("auth.usernameHint")}</p>
          </div>
        </SimpleForm>
      </div>
    </div>
  );
}
