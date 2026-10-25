"use client";

import { useActionState, useState } from "react";
import { updateAvatar } from "@/app/actions/avatar";
import { getAvailableAvatars, getAvatar, isAvatarId } from "@/lib/avatars";
import { useT } from "@/lib/i18n/client";
import UserAvatar from "./UserAvatar";

export default function AvatarPicker({ currentAvatarId, name, role = "USER" }: { currentAvatarId: string | null; name: string; role?: string }) {
  const [selected, setSelected] = useState(isAvatarId(currentAvatarId, role) ? currentAvatarId : "initials");
  const [state, action, pending] = useActionState(updateAvatar, undefined);
  const t = useT();
  const preview = getAvatar(selected, role);
  const feedback = state?.submitted === selected;
  return <form action={action}>
    <fieldset disabled={pending}>
      <legend className="text-lg font-bold">{t("avatar.choose")}</legend>
      <p className="mt-2 text-sm leading-6 text-neutral-400">{t("avatar.description")}</p>
      {role === "ADMIN" && <p className="mt-2 text-sm text-amber-300">{t("avatar.adminExclusive")}</p>}
      <div className="my-6 flex items-center gap-4 rounded-xl border border-white/10 bg-white/[.025] p-4">
        <UserAvatar avatarId={selected} name={name} role={role} label={preview ? t(preview.key) : t("avatar.initials")} className="h-16 w-16 text-2xl sm:h-20 sm:w-20" />
        <div><p className="text-xs text-neutral-400">{t("avatar.preview")}</p><output className="mt-1 block font-semibold" aria-live="polite">{preview ? t(preview.key) : t("avatar.initials")}</output></div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3">
        {getAvailableAvatars(role).map((avatar) => <label key={avatar.id} className="relative cursor-pointer">
          <input className="peer sr-only" type="radio" name="avatarId" value={avatar.id} checked={selected === avatar.id} onChange={() => setSelected(avatar.id)} />
          <span className="flex h-full flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] px-1 py-3 transition hover:border-white/30 peer-checked:border-brand-cyan peer-checked:bg-brand-cyan/10 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand">
            <UserAvatar avatarId={avatar.id} name={name} role={role} decorative className="h-11 w-11 sm:h-16 sm:w-16" />
            <span className="w-full text-center text-[10px] font-semibold leading-4 sm:text-xs">{t(avatar.key)}</span>
          </span>
          {selected === avatar.id && <span className="absolute end-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-cyan text-neutral-950 sm:end-1 sm:top-1 sm:h-5 sm:w-5" aria-hidden="true"><svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 4 4L19 6" /></svg></span>}
        </label>)}
      </div>
      <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-md py-2 text-sm text-neutral-300">
        <input type="radio" name="avatarId" value="initials" checked={selected === "initials"} onChange={() => setSelected("initials")} className="accent-brand" />{t("avatar.useInitials")}
      </label>
    </fieldset>
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button type="submit" className="btn-primary" disabled={pending}>{pending ? t("avatar.saving") : t("avatar.save")}</button>
      {feedback && state?.ok && <p role="status" className="text-sm text-emerald-300">{state.ok}</p>}
      {(feedback || !state?.submitted) && state?.error && <p role="alert" className="text-sm text-red-400">{state.error}</p>}
    </div>
  </form>;
}
