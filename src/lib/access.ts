import { isSubscribed, type SessionUser } from "./auth";

// نوع وصول كل مستخدم: يحدد الشارة وعدد الشاشات المسموح بها في وقت واحد
export type AccessKind = "admin" | "yearly" | "monthly" | "access" | "supporter" | "none";

export const PLAN_SCREENS: Record<AccessKind, number> = {
  admin: 99,
  yearly: 2,
  monthly: 1,
  access: 1, // أيام من كود تفعيل أو باقة دعم قديمة
  supporter: 0,
  none: 0,
};

export function accessKind(user: SessionUser): AccessKind {
  if (user.role === "ADMIN") return "admin";
  if (!isSubscribed(user)) return user.supporterSince ? "supporter" : "none";
  const plan = (["active", "trialing"].includes(user.subscriptionStatus) && user.subscriptionPlan) || user.accessPlan;
  return plan === "yearly" ? "yearly" : plan === "monthly" ? "monthly" : "access";
}

export const streamLimit = (user: SessionUser) => Math.max(1, PLAN_SCREENS[accessKind(user)]);
