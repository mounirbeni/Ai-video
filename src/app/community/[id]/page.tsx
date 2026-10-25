import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCommunityPost, getCommunityPublisher } from "@/lib/community";
import { isCommunityCategory } from "@/lib/community-options";
import { getT } from "@/lib/i18n/server";
import CommunityAuthor from "@/components/CommunityAuthor";

export default async function Post({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/community/${id}`);
  const [post, publisher, t] = await Promise.all([getCommunityPost(user, id), getCommunityPublisher(user), getT()]);
  if (!post) notFound();
  return <article className="mx-auto max-w-3xl">
    <div className="mb-7 flex items-center justify-between gap-3"><Link href="/community" className="text-sm text-neutral-400 hover:text-white">{t("community.back")}</Link>{publisher && <Link href={`/community/${id}/edit`} className="btn-ghost py-2 text-sm">{t("community.edit")}</Link>}</div>
    {!post.published && <p className="mb-6 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-200">{t("community.draftNotice")}</p>}
    <div className="mb-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-brand-cyan/10 px-3 py-1 text-brand-cyan">{t(`community.category.${isCommunityCategory(post.category) ? post.category : "updates"}`)}</span>{post.pinned && <span className="rounded-full bg-brand-violet/15 px-3 py-1 text-violet-200">{t("community.pinned")}</span>}</div>
    <h1 className="break-words text-3xl font-extrabold leading-snug sm:text-5xl" dir="auto">{post.title}</h1>
    <div className="my-7 border-y border-white/10 py-6"><CommunityAuthor author={post.author} date={post.createdAt} /></div>
    <div className="whitespace-pre-wrap break-words text-base leading-9 text-neutral-200 sm:text-lg sm:leading-10" dir="auto">{post.body}</div>
    {post.version > 0 && <p className="mt-8 text-xs text-neutral-500">{t("community.updated", { date: new Intl.DateTimeFormat(t.locale, { dateStyle: "medium", timeZone: "UTC" }).format(post.updatedAt) })}</p>}
  </article>;
}
