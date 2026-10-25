import type { AccountIdentity } from "./identity";

// Resolve on the server from the authenticated database record, never form data.
const DEVELOPER_EMAIL = "mobanunir@gmail.com";

export function getAccountIdentity(user: { role: string; email: string; emailVerified: Date | null } | null): AccountIdentity {
  if (!user) return null;
  if (user.emailVerified && user.email.trim().toLowerCase() === DEVELOPER_EMAIL) return "developer";
  return user.role === "ADMIN" ? "admin" : null;
}
