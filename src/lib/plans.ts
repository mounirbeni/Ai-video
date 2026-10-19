export const PLANS = {
  monthly: {
    id: "monthly",
    nameKey: "plan.monthly",
    price: "$4.99",
    periodKey: "plan.perMonth",
    days: 30,
    priceEnv: "STRIPE_PRICE_MONTHLY",
    paddlePriceEnv: "PADDLE_PRICE_MONTHLY",
  },
  yearly: {
    id: "yearly",
    nameKey: "plan.yearly",
    price: "$49.99",
    periodKey: "plan.perYear",
    days: 365,
    priceEnv: "STRIPE_PRICE_YEARLY",
    paddlePriceEnv: "PADDLE_PRICE_YEARLY",
  },
} as const;

export type PlanId = keyof typeof PLANS;
