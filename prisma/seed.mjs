import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error("عيّن ADMIN_EMAIL و ADMIN_PASSWORD في ملف .env");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);
await prisma.user.upsert({
  where: { email },
  update: { role: "ADMIN" },
  create: { email, name: "Admin", passwordHash, role: "ADMIN" },
});
console.log(`تم تجهيز حساب المدير: ${email}`);
await prisma.$disconnect();
