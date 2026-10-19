import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const demoPayments = !stripe && process.env.PAYMENTS_DEMO === "true";
