import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// الوضع التجريبي معطّل دائمًا في الإنتاج حتى لا يُفتح الاشتراك مجانًا بالخطأ
export const demoPayments =
  !stripe && process.env.PAYMENTS_DEMO === "true" && process.env.NODE_ENV !== "production";
