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
      // User has an active subscription
      if (subscription.plan_type === "PRO") {
        // PRO users have unlimited generations
        return {
          currentCount: 0,
          hasExceededLimit: false,
          resetAt: null,
          subscription: subscription,
        };
      } else if (subscription.plan_type === "BASIC") {
        // BASIC users have 5000 generations per month
        // You might want to implement monthly usage tracking here
        return {
          currentCount: 0,
          hasExceededLimit: false,
          resetAt: subscription.current_period_end,
          subscription: subscription,
        };
      }
    }
  }

  // First, clean up expired entries
  await supabase
    .from("audio_generation_usage")
    .delete()
    .lt("reset_at", new Date().toISOString());

  // Get or create usage record
  let { data: usage, error } = await supabase
    .from("audio_generation_usage")
    .select("*")
    .eq("ip_address", ipAddress)
    .single();

  if (!usage) {
    const { data: newUsage, error: insertError } = await supabase
      .from("audio_generation_usage")
      .insert({
        ip_address: ipAddress,
        user_id: userId,
        count: 1,
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
      .eq("id", usage.id);

    if (updateError) throw updateError;
    usage.count++;
  }

  // Check if user has exceeded free limit
  const hasExceededLimit = usage.count > PRICING_PLANS.FREE.generations;

  return {
    currentCount: usage.count,
    hasExceededLimit,
    resetAt: usage.reset_at,
  };
}
