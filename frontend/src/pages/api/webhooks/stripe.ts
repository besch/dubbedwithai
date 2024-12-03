import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function updateSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;
  const subscriptionId = subscription.id;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Get the price ID to determine the plan type
  const priceId = subscription.items.data[0].price.id;
  const planType = determinePlanType(priceId);

  await supabase
    .from("subscriptions")
    .upsert({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      status: mapStripeStatus(status),
      current_period_end: currentPeriodEnd.toISOString(),
      plan_type: planType,
      updated_at: new Date().toISOString(),
    })
    .match({ stripe_subscription_id: subscriptionId });
}

function determinePlanType(priceId: string): "BASIC" | "PRO" {
  if (
    priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID ||
    priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID
  ) {
    return "BASIC";
  }
  return "PRO";
}

function mapStripeStatus(
  status: string
): "active" | "canceled" | "past_due" | "unpaid" {
  switch (status) {
    case "active":
      return "active";
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    default:
      return "unpaid";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"]!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`
    );
    return res
      .status(400)
      .send(
        `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`
      );
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        const subscription = event.data.object as Stripe.Subscription;
        await updateSubscription(subscription);
        break;

      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await updateSubscription(subscription);
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}
