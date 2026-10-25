import { AVATAR_ATLAS, getAvatar } from "@/lib/avatars";

export default function UserAvatar({ avatarId, name, className = "h-10 w-10", label, decorative = false }: {
  avatarId?: string | null; name: string; className?: string; label?: string; decorative?: boolean;
}) {
  const avatar = getAvatar(avatarId);
  const initial = Array.from(name.trim())[0]?.toLocaleUpperCase() || "?";
  return <span
    role={decorative ? undefined : "img"}
    aria-label={decorative ? undefined : label || name}
    aria-hidden={decorative || undefined}
    className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-violet via-brand-blue to-brand-cyan font-bold text-white ring-1 ring-white/15 ${className}`}
    style={avatar ? { backgroundImage: `url(${AVATAR_ATLAS})`, backgroundSize: "500% 200%", backgroundPosition: `${avatar.column * 25}% ${avatar.row * 100}%`, backgroundRepeat: "no-repeat" } : undefined}
  >{!avatar && initial}</span>;
}
