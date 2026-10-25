"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCommunityPublisher, isCommunityCategory } from "@/lib/community";
import { db } from "@/lib/db";
import { consumeLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";

export type CommunityState = { error: string } | undefined;

function postIdentity(form: FormData) {
  const id = form.get("id"), version = form.get("version");
  if (typeof id !== "string" || !/^[a-z0-9-]{10,64}$/i.test(id) || typeof version !== "string" || !/^\d{1,9}$/.test(version)) return null;
  return { id, version: Number(version) };
}

export async function saveCommunityPost(_: CommunityState, form: FormData): Promise<CommunityState> {
  const user = await requireUser("/community/new");
  const t = await getT();
  if (!await getCommunityPublisher(user)) return { error: t("community.forbidden") };
  const titleValue = form.get("title"), bodyValue = form.get("body"), category = form.get("category");
  const title = typeof titleValue === "string" ? titleValue.trim() : "";
  const body = typeof bodyValue === "string" ? bodyValue.trim() : "";
  if (title.length < 3 || title.length > 140 || body.length < 20 || body.length > 12000 || !isCommunityCategory(category)) return { error: t("community.invalid") };
  const editing = form.has("id");
  const identity = editing ? postIdentity(form) : null;
  if (editing && !identity) return { error: t("community.invalid") };
  const published = form.get("published") === "on", pinned = published && form.get("pinned") === "on";
  let id: string;
  try {
    if (!await consumeLimit("community-write", user.id, 30, 60)) return { error: t("community.rateLimit") };
    const data = { title, body, category, published, pinned };
    if (identity) {
      const result = await db.communityPost.updateMany({ where: identity, data: { ...data, version: { increment: 1 } } });
      if (!result.count) return { error: t("community.conflict") };
      id = identity.id;
    } else {
      const post = await db.communityPost.create({ data: { ...data, authorId: user.id } });
      id = post.id;
    }
  } catch { return { error: t("community.error") }; }
  revalidatePath("/community");
  revalidatePath(`/community/${id}`);
  redirect(`/community/${id}`);
}

export async function deleteCommunityPost(_: CommunityState, form: FormData): Promise<CommunityState> {
  const user = await requireUser("/community");
  const t = await getT();
  if (!await getCommunityPublisher(user)) return { error: t("community.forbidden") };
  const identity = postIdentity(form);
  if (!identity || form.get("confirm") !== "delete") return { error: t("community.invalid") };
  try {
    if (!await consumeLimit("community-write", user.id, 30, 60)) return { error: t("community.rateLimit") };
    const result = await db.communityPost.deleteMany({ where: identity });
    if (!result.count) return { error: t("community.conflict") };
  } catch { return { error: t("community.error") }; }
  revalidatePath("/community");
  revalidatePath(`/community/${identity.id}`);
  redirect("/community?view=manage&deleted=1");
}
