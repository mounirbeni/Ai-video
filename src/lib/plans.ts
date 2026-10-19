export const PLANS = {
  monthly: {
    id: "monthly",
    name: "الخطة الشهرية",
    price: "4.99$",
    period: "شهريًا",
    days: 30,
    priceEnv: "STRIPE_PRICE_MONTHLY",
  },
  yearly: {
    id: "yearly",
    name: "الخطة السنوية",
    price: "49.99$",
    period: "سنويًا",
    days: 365,
    priceEnv: "STRIPE_PRICE_YEARLY",
  },
} as const;

export type PlanId = keyof typeof PLANS;
