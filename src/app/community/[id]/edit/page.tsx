import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCommunityPost, getCommunityPublisher } from "@/lib/community";
import { getT } from "@/lib/i18n/server";
import CommunityEditor, { DeleteCommunityPost } from "@/components/CommunityEditor";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/community/${id}/edit`);
  if (!await getCommunityPublisher(user)) redirect("/community");
  const post = await getCommunityPost(user, id);
  if (!post) notFound();
  const t = await getT();
  const { title, body, category, published, pinned, version } = post;
  return <div className="mx-auto max-w-3xl"><Link href={`/community/${id}`} className="text-sm text-neutral-400 hover:text-white">{t("community.backPost")}</Link><h1 className="mb-7 mt-6 text-3xl font-bold">{t("community.edit")}</h1><CommunityEditor post={{ id, title, body, category, published, pinned, version }} /><DeleteCommunityPost id={id} version={version} /></div>;
}
