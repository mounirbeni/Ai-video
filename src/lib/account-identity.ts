import type { AccountIdentity } from "./identity";

// The developer's email comes from server configuration (DEVELOPER_EMAIL), never from code or form data.
// Resolve identity on the server from the authenticated database record.
export function getAccountIdentity(user: { role: string; email: string; emailVerified: Date | null } | null): AccountIdentity {
  if (!user) return null;
  const developer = process.env.DEVELOPER_EMAIL?.trim().toLowerCase();
  if (developer && user.emailVerified && user.email.trim().toLowerCase() === developer) return "developer";
  return user.role === "ADMIN" ? "admin" : null;
}
