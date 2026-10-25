export type AccountIdentity = "admin" | "developer" | null;

export const identityLabelKey = (identity: NonNullable<AccountIdentity>) =>
  identity === "admin" ? "identity.admin" as const : "identity.developer" as const;
