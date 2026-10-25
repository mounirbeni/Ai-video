"use client";

import { useActionState, useState } from "react";
import { saveCommunityPost, deleteCommunityPost } from "@/app/actions/community";
import { COMMUNITY_CATEGORIES } from "@/lib/community-options";
import { useT } from "@/lib/i18n/client";

type EditorPost = { id: string; title: string; body: string; category: string; published: boolean; pinned: boolean; version: number };

export default function CommunityEditor({ post }: { post?: EditorPost }) {
  const t = useT();
  const [state, action, pending] = useActionState(saveCommunityPost, undefined);
  const [title, setTitle] = useState(post?.title || "");
  const [body, setBody] = useState(post?.body || "");
  const [category, setCategory] = useState(post?.category || "updates");
  const [published, setPublished] = useState(post?.published ?? false);
  const [pinned, setPinned] = useState(post?.pinned ?? false);
  return <form action={action} className="card space-y-6">
    {post && <><input type="hidden" name="id" value={post.id} /><input type="hidden" name="version" value={post.version} /></>}
    <fieldset disabled={pending} className="space-y-6">
      <div><label htmlFor="post-title" className="mb-2 block text-sm font-semibold">{t("community.postTitle")}</label><input id="post-title" name="title" className="input" dir="auto" minLength={3} maxLength={140} required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div><label htmlFor="post-category" className="mb-2 block text-sm font-semibold">{t("community.categoryLabel")}</label><select id="post-category" name="category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>{COMMUNITY_CATEGORIES.map((c) => <option key={c} value={c}>{t(`community.category.${c}`)}</option>)}</select></div>
      <div><label htmlFor="post-body" className="mb-2 block text-sm font-semibold">{t("community.bodyLabel")}</label><textarea id="post-body" name="body" className="input min-h-80 resize-y leading-8" dir="auto" rows={12} minLength={20} maxLength={12000} required value={body} onChange={(e) => setBody(e.target.value)} aria-describedby="post-body-hint" /><div id="post-body-hint" className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-neutral-400"><span>{t("community.plainText")}</span><span>{body.length.toLocaleString(t.locale)} / 12,000</span></div></div>
      <div className="space-y-4 rounded-xl border border-white/10 bg-white/[.025] p-4">
        <label className="flex cursor-pointer items-start gap-3"><input type="checkbox" name="published" checked={published} onChange={(e) => setPublished(e.target.checked)} className="mt-1 accent-brand" /><span><span className="block text-sm font-semibold">{t("community.publishLabel")}</span><span className="mt-1 block text-xs leading-6 text-neutral-400">{t("community.publishHint")}</span></span></label>
        <label className={`flex items-center gap-3 text-sm ${published ? "cursor-pointer" : "text-neutral-500"}`}><input type="checkbox" name="pinned" checked={pinned} disabled={!published} onChange={(e) => setPinned(e.target.checked)} className="accent-brand" />{t("community.pinLabel")}</label>
      </div>
    </fieldset>
    {state?.error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{state.error}</p>}
    <div className="flex flex-wrap items-center gap-3"><button type="submit" className="btn-primary" disabled={pending}>{pending ? t("community.saving") : published ? t("community.savePublished") : t("community.saveDraft")}</button><p className="text-xs text-neutral-400">{published ? t("community.visibleMembers") : t("community.visibleTeam")}</p></div>
  </form>;
}

export function DeleteCommunityPost({ id, version }: { id: string; version: number }) {
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  const [state, action, pending] = useActionState(deleteCommunityPost, undefined);
  return <div className="mt-8 rounded-xl border border-red-400/20 p-5">
    {!confirm ? <button type="button" onClick={() => setConfirm(true)} className="rounded text-sm text-red-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-300">{t("community.delete")}</button> : <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={id} /><input type="hidden" name="version" value={version} /><input type="hidden" name="confirm" value="delete" />
      <p className="text-sm leading-7 text-red-200">{t("community.deleteConfirm")}</p>
      <div className="flex gap-3"><button type="submit" disabled={pending} className="rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-200 disabled:opacity-50">{pending ? t("community.saving") : t("community.deleteConfirmButton")}</button><button type="button" disabled={pending} onClick={() => setConfirm(false)} className="btn-ghost py-2 text-sm">{t("community.cancel")}</button></div>
    </form>}
    {state?.error && <p role="alert" className="mt-3 text-sm text-red-300">{state.error}</p>}
  </div>;
}
