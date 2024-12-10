export type DubbingVoice =
  | "alloy"
  | "echo"
  | "fable"
  | "onyx"
  | "nova"
  | "shimmer";

export interface Subscription {
  id: string;
  plan_type: string;
  plan_period: string;
  status: string;
  current_period_end: string;
  current_period_start: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
  created_at: string;
  updated_at: string;
}
