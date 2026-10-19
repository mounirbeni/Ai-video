import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

const COOKIE = "session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

export async function getUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return await db.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

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
