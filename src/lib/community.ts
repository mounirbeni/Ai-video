import type { Prisma } from "@prisma/client";
import { db } from "./db";
import type { SessionUser } from "./auth";
import { getAccountIdentity } from "./account-identity";
import { isCommunityCategory } from "./community-options";
export { isCommunityCategory } from "./community-options";

export const communityAuthorSelect = { id: true, name: true, username: true, avatarId: true, role: true, email: true, emailVerified: true } as const;
export const communityPostInclude = { author: { select: communityAuthorSelect } } as const;
export type CommunityPostWithAuthor = Prisma.CommunityPostGetPayload<{ include: typeof communityPostInclude }>;

export async function getCommunityPublisher(user: SessionUser | null) {
  if (!user) return null;
  if (getAccountIdentity(user) === "developer") return "developer" as const;
  if (user.role !== "ADMIN") return null;
  const ownerEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (ownerEmail) return user.email.trim().toLowerCase() === ownerEmail ? "admin" as const : null;
  // A legacy installation with one admin still works. Multiple admins require
  // ADMIN_EMAIL; adding an admin must never grant another publishing seat.
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true }, take: 2 });
  return admins.length === 1 && admins[0].id === user.id ? "admin" as const : null;
}

export async function getCommunityFeed(user: SessionUser, input: { page?: string; category?: string; view?: string }) {
  if (!user) throw new Error("Authentication required");
  const publisher = await getCommunityPublisher(user);
  const manage = !!publisher && input.view === "manage";
  const page = /^\d{1,3}$/.test(input.page || "") ? Math.max(1, Number(input.page)) : 1;
  const category = isCommunityCategory(input.category) ? input.category : undefined;
  const posts = await db.communityPost.findMany({
    where: { ...(manage ? {} : { published: true }), ...(category ? { category } : {}) },
    include: communityPostInclude,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 21,
  });
  return { publisher, manage, page, category, posts: posts.slice(0, 20), hasNext: posts.length > 20 };
}

export async function getCommunityPost(user: SessionUser | null, id: string) {
  if (!user || !/^[a-z0-9-]{10,64}$/i.test(id)) return null;
  const publisher = await getCommunityPublisher(user);
  return db.communityPost.findFirst({ where: { id, ...(publisher ? {} : { published: true }) }, include: communityPostInclude });
}
