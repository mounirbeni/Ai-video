"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions/auth";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn-primary w-full" disabled={pending}>{pending ? "…" : label}</button>;
}

export default function SimpleForm({
  action, label, children,
}: { action: (s: FormState, f: FormData) => Promise<FormState>; label: string; children: React.ReactNode }) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      {children}
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.ok ? <p className="text-sm text-green-400">{state.ok}</p> : <Submit label={label} />}
    </form>
  );
}
