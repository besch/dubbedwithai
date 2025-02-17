export type SubscriptionPlan = "FREE" | "BASIC" | "PRO";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "unpaid";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: SubscriptionStatus;
  plan_type: SubscriptionPlan;
  plan_period: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
} 