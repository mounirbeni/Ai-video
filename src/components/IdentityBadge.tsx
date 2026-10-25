import type { AccountIdentity } from "@/lib/identity";

export function IdentityMark({ identity, className = "h-4 w-4" }: { identity: NonNullable<AccountIdentity>; className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {identity === "admin" ? <><path d="m3 6 4 4 5-7 5 7 4-4-2 12H5L3 6Z" /><path d="M7 21h10" /></> : <><path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-14-2 18" /></>}
  </svg>;
}

export default function IdentityBadge({ identity, label, compact = false }: { identity: AccountIdentity; label: string; compact?: boolean }) {
  if (!identity) return null;
  return <span data-account-identity={identity} className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border font-semibold ${compact ? "p-1.5" : "px-3 py-1 text-xs"} ${identity === "admin" ? "border-amber-300/40 bg-amber-300/10 text-amber-200" : "border-cyan-300/40 bg-cyan-300/10 text-cyan-200"}`} title={compact ? label : undefined}>
    <IdentityMark identity={identity} className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
    <span className={compact ? "sr-only" : undefined}>{label}</span>
  </span>;
}
