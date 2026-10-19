import crypto from "node:crypto";
import { db } from "./db";

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function issueToken(userId: string, type: "VERIFY" | "RESET", hours: number) {
  await db.authToken.deleteMany({ where: { userId, type } });
  const token = crypto.randomBytes(32).toString("hex");
  await db.authToken.create({
    data: { userId, type, tokenHash: sha(token), expiresAt: new Date(Date.now() + hours * 3600000) },
  });
  return token;
}

// يستهلك الرمز (استخدام لمرة واحدة) ويعيد معرّف المستخدم إن كان صالحًا
export async function consumeToken(token: string, type: "VERIFY" | "RESET") {
  const row = await db.authToken.findUnique({ where: { tokenHash: sha(token) } });
  if (!row || row.type !== type) return null;
  await db.authToken.delete({ where: { id: row.id } });
  return row.expiresAt > new Date() ? row.userId : null;
}
