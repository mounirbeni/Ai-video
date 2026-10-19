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

// باقات الدعم لمرة واحدة: تُباع خدمةً فعلية (أيام مشاهدة + شارة داعم) لا تبرعًا مجردًا، كما تشترط Paddle
export const SUPPORT_TIERS = {
  fan: { id: "fan", nameKey: "support.fan", price: "$5", cents: 500, days: 7, paddlePriceEnv: "PADDLE_PRICE_SUPPORT_FAN" },
  supporter: { id: "supporter", nameKey: "support.supporter", price: "$10", cents: 1000, days: 30, paddlePriceEnv: "PADDLE_PRICE_SUPPORT_SUPPORTER" },
  producer: { id: "producer", nameKey: "support.producer", price: "$25", cents: 2500, days: 90, paddlePriceEnv: "PADDLE_PRICE_SUPPORT_PRODUCER" },
} as const;

export type SupportTierId = keyof typeof SUPPORT_TIERS;
