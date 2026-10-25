import { AVATAR_ATLAS, getAvatar, getDisplayAvatarId } from "@/lib/avatars";
import type { AccountIdentity } from "@/lib/identity";

export default function UserAvatar({ avatarId, name, role = "USER", identity = null, className = "h-10 w-10", label, decorative = false }: {
  avatarId?: string | null; name: string; role?: string; identity?: AccountIdentity; className?: string; label?: string; decorative?: boolean;
}) {
  const avatar = getAvatar(getDisplayAvatarId(avatarId, role, identity), role, identity);
  const kind = identity || (role === "ADMIN" ? "admin" : null);
  const frame = kind === "developer" ? "0 0 0 2px #67e8f9, 0 0 0 5px #8b5cf633, 0 0 24px #22d3ee33" : kind === "admin" ? "0 0 0 2px #e9bd64, 0 0 0 5px #e9bd6422, 0 0 24px #f59e0b33" : undefined;
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase() || "?";
  return <span
    role={decorative ? undefined : "img"}
    aria-label={decorative ? undefined : label || name}
    aria-hidden={decorative || undefined}
    className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-violet via-brand-blue to-brand-cyan font-bold text-white ring-1 ring-white/15 ${className}`}
    data-avatar-identity={kind || undefined}
    style={{ boxShadow: frame, ...(avatar ? "image" in avatar
      ? { backgroundImage: `url(${avatar.image})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
      : { backgroundImage: `url(${AVATAR_ATLAS})`, backgroundSize: "500% 200%", backgroundPosition: `${avatar.column * 25}% ${avatar.row * 100}%`, backgroundRepeat: "no-repeat" } : {}) }}
  >{!avatar && initial}</span>;
}
