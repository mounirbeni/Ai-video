export function sessionSecret(value = process.env.AUTH_SECRET, production = process.env.NODE_ENV === "production") {
  if (production && (!value || value.length < 32 || value === "dev-secret")) {
    throw new Error("AUTH_SECRET must contain at least 32 characters in production");
  }
  return new TextEncoder().encode(value || "dev-secret");
}

export function validSessionVersion(claim: unknown, current: number) {
  // Tokens issued before versioning are invalidated on rollout.
  return typeof claim === "number" && Number.isInteger(claim) && claim === current;
}
