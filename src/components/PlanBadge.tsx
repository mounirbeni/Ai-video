import type { AccessKind } from "@/lib/access";

const STYLE: Record<AccessKind, string> = {
  admin: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  yearly: "bg-gradient-to-r from-brand-violet/30 to-brand-cyan/30 text-white ring-brand-violet/50",
  monthly: "bg-brand-blue/15 text-blue-300 ring-brand-blue/40",
  access: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/30",
  supporter: "bg-pink-500/10 text-pink-300 ring-pink-500/30",
  none: "bg-white/5 text-neutral-400 ring-white/10",
};

export default function PlanBadge({ kind, label }: { kind: AccessKind; label: string }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STYLE[kind]}`}>{label}</span>;
}
