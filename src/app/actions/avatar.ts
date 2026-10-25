"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isAvatarId } from "@/lib/avatars";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";

export type AvatarState = { error?: string; ok?: string; submitted?: string } | undefined;

export async function updateAvatar(_: AvatarState, form: FormData): Promise<AvatarState> {
  const user = await requireUser("/account#avatar-settings");
  const t = await getT();
  const choice = form.get("avatarId");
  if (choice !== "initials" && !isAvatarId(choice, user.role)) return { error: t("avatar.invalid") };
  const avatarId = choice === "initials" ? null : choice;
  try {
    await db.user.update({ where: { id: user.id }, data: { avatarId } });
  } catch {
    return { error: t("avatar.error"), submitted: choice };
  }
  revalidatePath("/", "layout");
  return { ok: t("avatar.saved"), submitted: choice };
}
