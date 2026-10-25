import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCommunityPublisher } from "@/lib/community";
import { getT } from "@/lib/i18n/server";
import CommunityEditor from "@/components/CommunityEditor";

export default async function NewPost() {
  const user = await requireUser("/community/new");
  if (!await getCommunityPublisher(user)) redirect("/community");
  const t = await getT();
  return <div className="mx-auto max-w-3xl"><Link href="/community?view=manage" className="text-sm text-neutral-400 hover:text-white">{t("community.back")}</Link><h1 className="mb-3 mt-6 text-3xl font-bold">{t("community.new")}</h1><p className="mb-7 text-sm leading-7 text-neutral-400">{t("community.editorHint")}</p><CommunityEditor /></div>;
}
