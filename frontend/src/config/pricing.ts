export const PRICING_PLANS = {
  FREE: {
    name: "Free",
    generations: 150,
    period: "week",
    price: {
      monthly: 0,
      yearly: 0,
    },
  },
  BASIC: {
    name: "Basic",
    generations: 5000,
    period: "month",
    price: {
      monthly: 7,
      yearly: 70, // ~$5.83/month when paid yearly
    },
    stripeMonthlyPriceId: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.STRIPE_BASIC_YEARLY_PRICE_ID,
  },
  PRO: {
    name: "Pro",
    generations: Infinity,
    period: "month",
    price: {
      monthly: 20,
      yearly: 200, // ~$16.67/month when paid yearly
    },
    stripeMonthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  },
} as const;

export type PlanType = keyof typeof PRICING_PLANS;
