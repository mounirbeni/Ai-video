"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const opt = (f: FormData, k: string) => str(f, k) || null;
const int = (f: FormData, k: string) => (str(f, k) ? parseInt(str(f, k)) || null : null);
const bool = (f: FormData, k: string) => f.get(k) === "on";

function titleData(f: FormData, type: string) {
  // المسلسل يُقاس بعدد الحلقات، والفيلم بالمدة
  const series = type === "SERIES";
  return {
    name: str(f, "name"),
    description: str(f, "description"),
    year: int(f, "year"),
    genres: str(f, "genres"),
    posterUrl: opt(f, "posterUrl"),
    backdropUrl: opt(f, "backdropUrl"),
    trailerUrl: opt(f, "trailerUrl"),
    videoSrc: opt(f, "videoSrc"),
    duration: series ? null : int(f, "duration"),
    plannedEpisodes: series ? int(f, "plannedEpisodes") : null,
    isFree: bool(f, "isFree"),
    featured: bool(f, "featured"),
    comingSoon: bool(f, "comingSoon"),
    releaseLabel: opt(f, "releaseLabel"),
    published: bool(f, "published"),
  };
}

export async function createTitle(f: FormData) {
  await requireAdmin();
  const type = str(f, "type") === "SERIES" ? "SERIES" : "MOVIE";
  const data = titleData(f, type);
  const t = await db.title.create({ data: { ...data, type, slug: slugify(data.name) } });
  revalidatePath("/", "layout");
  redirect(`/admin/${t.id}`);
}

export async function updateTitle(id: string, f: FormData) {
  await requireAdmin();
  const current = await db.title.findUniqueOrThrow({ where: { id }, select: { type: true } });
  await db.title.update({ where: { id }, data: titleData(f, current.type) });
  revalidatePath("/", "layout");
  redirect(`/admin/${id}?saved=1`);
}

export async function deleteTitle(id: string) {
  await requireAdmin();
  await db.title.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function addEpisode(titleId: string, f: FormData) {
  await requireAdmin();
  const season = int(f, "season") ?? 1;
  const number = int(f, "number") ?? (await db.episode.count({ where: { titleId, season } })) + 1;
  await db.episode.upsert({
    where: { titleId_season_number: { titleId, season, number } },
    update: { name: str(f, "name"), description: str(f, "description"), videoSrc: str(f, "videoSrc"), duration: int(f, "duration"), isFree: bool(f, "isFree") },
    create: { titleId, season, number, name: str(f, "name"), description: str(f, "description"), videoSrc: str(f, "videoSrc"), duration: int(f, "duration"), isFree: bool(f, "isFree") },
  });
  revalidatePath(`/admin/${titleId}`);
}

export async function deleteEpisode(id: string) {
  await requireAdmin();
  const e = await db.episode.delete({ where: { id } });
  revalidatePath(`/admin/${e.titleId}`);
}

export async function setSubscription(userId: string, f: FormData) {
  await requireAdmin();
  const days = Math.min(int(f, "days") ?? 0, 3650); // حد أقصى 10 سنوات
  if ((await db.user.findUnique({ where: { id: userId } }))?.role === "ADMIN") return;
  await db.user.update({
    where: { id: userId },
    data: days > 0
      ? { subscriptionStatus: "active", currentPeriodEnd: new Date(Date.now() + days * 86400000) }
      : { subscriptionStatus: "canceled", currentPeriodEnd: new Date() },
  });
  revalidatePath("/admin/users");
}
