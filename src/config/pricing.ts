import { PlanLimits } from '@/lib/planLimits'

export function createPricingPlans(planLimits: PlanLimits) {
  return {
    FREE: {
      name: "Free",
      generations: planLimits.FREE.request_limit ?? 300,
      period: planLimits.FREE.reset_period,
      price: {
        monthly: 0,
        yearly: 0,
      },
    },
    BASIC: {
      name: "Basic",
      generations: planLimits.BASIC.request_limit ?? 5000,
      period: planLimits.BASIC.reset_period,
      price: {
        monthly: 7,
        yearly: 70,
      },
      stripeMonthlyPriceId: planLimits.BASIC.stripe_price_id,
      stripeYearlyPriceId: planLimits.BASIC.stripe_price_id,
    },
    PRO: {
      name: "Pro",
      generations: planLimits.PRO.request_limit ?? Infinity,
      period: planLimits.PRO.reset_period,
      price: {
        monthly: 20,
        yearly: 200,
      },
      stripeMonthlyPriceId: planLimits.PRO.stripe_price_id,
      stripeYearlyPriceId: planLimits.PRO.stripe_price_id,
    },
  } as const;
}

export type PlanType = 'FREE' | 'BASIC' | 'PRO';
