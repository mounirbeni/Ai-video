import { transaction } from "./transaction";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import type { SessionUser } from "./auth";
import { streamLimit } from "./access";

export const MAX_STREAMS = Number(process.env.MAX_STREAMS || 2);
const ACTIVE_MS = 90_000; // الجهاز نشط إن أرسل نبضة خلال 90 ثانية
const DEVICE_COOKIE = "did";

export async function deviceId() {
  let id = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!id || !/^[a-f0-9]{32}$/.test(id)) {
    id = crypto.randomBytes(16).toString("hex");
    (await cookies()).set(DEVICE_COOKIE, id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return id;
}

// يسجّل هذا الجهاز كمشاهد نشط، ويرفض إن تجاوز الحساب عدد الأجهزة المسموح
export async function claimStream(user: SessionUser, device: string) {
  if (user.role === "ADMIN") return true;
  return transaction(async (q) => {
    await q.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id} FOR UPDATE`;
    const since = new Date(Date.now() - ACTIVE_MS);
    const others = await q.activeStream.count({
      where: { userId: user.id, deviceId: { not: device }, lastSeen: { gt: since } },
    });
    if (others >= streamLimit(user)) return false;
    await q.activeStream.upsert({
      where: { userId_deviceId: { userId: user.id, deviceId: device } },
      update: { lastSeen: new Date() },
      create: { userId: user.id, deviceId: device },
    });
    return true;
  });
}

export async function releaseStream(userId: string, device: string) {
  await db.activeStream.deleteMany({ where: { userId, deviceId: device } });
}
