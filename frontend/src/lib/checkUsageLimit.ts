import { PRICING_PLANS } from "@/config/pricing";
import supabase from "./supabaseClient";

export async function checkUsageLimit(ipAddress: string, userId?: string) {
  // If user is logged in, check their subscription
  if (userId) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (subscription) {
      if (subscription.plan_type === "PRO") {
        return {
          currentCount: 0,
          hasExceededLimit: false,
          resetAt: null,
          subscription: subscription,
        };
      } else if (subscription.plan_type === "BASIC") {
        return {
          currentCount: 0,
          hasExceededLimit: false,
          resetAt: subscription.current_period_end,
          subscription: subscription,
        };
      }
    }
  }

  // Get current usage record
  let { data: usage } = await supabase
    .from("audio_generation_usage")
    .select("*")
    .eq("ip_address", ipAddress)
    .single();

  if (!usage) {
    // Create new usage record if none exists
    const resetAt = new Date();
    resetAt.setDate(resetAt.getDate() + 30); // Reset after 30 days

    const { data: newUsage, error: insertError } = await supabase
      .from("audio_generation_usage")
      .insert({
        ip_address: ipAddress,
        count: 1,
        reset_at: resetAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;
    usage = newUsage;
  } else {
    // Increment usage count
    const { error: updateError } = await supabase
      .from("audio_generation_usage")
      .update({ count: usage.count + 1 })
      .eq("ip_address", ipAddress);

    if (updateError) throw updateError;
    usage.count++;
  }

  return {
    currentCount: usage.count,
    hasExceededLimit: usage.count > PRICING_PLANS.FREE.generations,
    resetAt: usage.reset_at,
  };
}
