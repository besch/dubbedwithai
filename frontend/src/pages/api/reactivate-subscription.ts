import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

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
    // Remove the cancellation schedule
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    res.status(200).json({ subscription });
  } catch (error) {
    console.error("Error reactivating subscription:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ error: `Failed to reactivate subscription: ${errorMessage}` });
  }
}
