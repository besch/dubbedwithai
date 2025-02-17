import { NextApiRequest, NextApiResponse } from "next";
import stripe from "@/lib/stripeClient";
import supabase from "@/lib/supabaseClient";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { subscriptionId } = req.body;

  if (!subscriptionId) {
    return res.status(400).json({ error: "Subscription ID is required" });
  }

  try {
    // Cancel the subscription at the end of the current period
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update the subscription in Supabase
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscriptionId);

    if (updateError) {
      console.error("Error updating subscription in Supabase:", updateError);
      throw updateError;
    }

    res.status(200).json({ subscription });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ error: `Failed to cancel subscription: ${errorMessage}` });
  }
}
