import type { Prisma } from "@prisma/client";
import crypto from "node:crypto";
import { db } from "./db";

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function issueToken(userId: string, type: "VERIFY" | "RESET", hours: number) {
  // نحذف المنتهية فقط: الروابط السابقة تبقى صالحة إن ضغط المستخدم «إعادة الإرسال» أكثر من مرة
  await db.authToken.deleteMany({ where: { userId, type, expiresAt: { lt: new Date() } } });
  const token = crypto.randomBytes(32).toString("hex");
  await db.authToken.create({
    data: { userId, type, tokenHash: sha(token), expiresAt: new Date(Date.now() + hours * 3600000) },
  });
  return token;
}

// يستهلك الرمز (استخدام لمرة واحدة) ويعيد معرّف المستخدم إن كان صالحًا
export async function consumeToken(token: string, type: "VERIFY" | "RESET", q: Prisma.TransactionClient = db) {
  const row = await q.authToken.findUnique({ where: { tokenHash: sha(token) } });
  if (!row || row.type !== type) return null;
  const claimed = await q.authToken.deleteMany({ where: { id: row.id, expiresAt: { gt: new Date() } } });
  return claimed.count === 1 ? row.userId : null;
}
