"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function setWatchlist(titleId: string, saved: boolean) {
  const user = await requireUser("/my-list");
  if (saved) {
    const title = await db.title.findFirst({ where: { id: titleId, published: true }, select: { id: true } });
    if (!title) throw new Error("Title unavailable");
    await db.watchlist.upsert({ where: { userId_titleId: { userId: user.id, titleId } }, create: { userId: user.id, titleId }, update: {} });
  } else {
    await db.watchlist.deleteMany({ where: { userId: user.id, titleId } });
  }
  revalidatePath("/", "layout");
}
