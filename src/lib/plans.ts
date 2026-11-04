export const PLANS = {
  monthly: { id: "monthly", nameKey: "plan.monthly", price: "$4.99", periodKey: "plan.perMonth", days: 30 },
  yearly: { id: "yearly", nameKey: "plan.yearly", price: "$49.99", periodKey: "plan.perYear", days: 365 },
} as const;

export type PlanId = keyof typeof PLANS;
