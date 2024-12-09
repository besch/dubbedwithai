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
      yearly: 70,
    },
    stripeMonthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID,
  },
  PRO: {
    name: "Pro",
    generations: Infinity,
    period: "month",
    price: {
      monthly: 20,
      yearly: 200,
    },
    stripeMonthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
    stripeYearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID,
  },
} as const;

export type PlanType = keyof typeof PRICING_PLANS;
