import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";
import { sessionSecret, validSessionVersion } from "./session-security";
import { cache } from "react";

const COOKIE = "session";
const secret = sessionSecret;

export async function createSession(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { sessionVersion: true } });
  const token = await new SignJWT({ sub: userId, version: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export const getUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const user = await db.user.findUnique({ where: { id: payload.sub } });
    return user && validSessionVersion(payload.version, user.sessionVersion) ? user : null;
  } catch {
    return null;
  }
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getUser>>>;

export function isSubscribed(user: SessionUser | null) {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.accessUntil && user.accessUntil > new Date()) return true;
  const ok = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing";
  return ok && (!user.currentPeriodEnd || user.currentPeriodEnd > new Date());
}

export async function requireUser(next = "/") {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await getUser();
  if (!user || user.role !== "ADMIN") redirect("/login?next=/admin");
  return user;
}
