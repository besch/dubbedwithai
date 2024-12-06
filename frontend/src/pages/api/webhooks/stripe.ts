import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";
import Stripe from "stripe";
import supabase from "@/lib/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const config = {
  api: {
    bodyParser: false,
  },
};

async function updateSubscription(
  subscription: Stripe.Subscription,
  session?: Stripe.Checkout.Session
) {
  const customerId = subscription.customer as string;
  const status = subscription.status;
  const subscriptionId = subscription.id;
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);

  // Get the price ID to determine the plan type
  const priceId = subscription.items.data[0].price.id;
  const planType = determinePlanType(priceId);

  // Check for userId in multiple places
  let userId = subscription.metadata?.userId;

  if (!userId && session?.metadata?.userId) {
    userId = session.metadata.userId;
  }

  if (!userId) {
    // Try to get userId from customer metadata
    const customerResponse = await stripe.customers.retrieve(customerId);
    if ("deleted" in customerResponse) {
      console.error("Customer has been deleted");
    } else {
      userId = customerResponse.metadata?.userId;
    }
  }

  console.log("Debug metadata:", {
    sessionMetadata: session?.metadata,
    subscriptionMetadata: subscription.metadata,
    userId: userId,
    customerId: customerId,
  });

  if (!userId) {
    console.error(
      "No user ID found in metadata. Session and subscription data:",
      {
        sessionMetadata: session?.metadata,
        subscriptionMetadata: subscription.metadata,
        customerId: customerId,
      }
    );
    return;
  }

  const subscriptionData = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    status: subscription.cancel_at_period_end
      ? "canceled"
      : mapStripeStatus(status),
    current_period_start: currentPeriodStart.toISOString(),
    current_period_end: currentPeriodEnd.toISOString(),
    plan_type: planType,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };
  console.log("!!!!!!!!!!subscriptionData", subscriptionData);

  const { error } = await supabase
    .from("subscriptions")
    .upsert(subscriptionData)
    .match({ stripe_subscription_id: subscriptionId });

  if (error) {
    console.error("Error updating subscription in Supabase:", error);
    throw error;
  }
}

function determinePlanType(priceId: string): "BASIC" | "PRO" {
  if (
    priceId === process.env.STRIPE_BASIC_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_BASIC_YEARLY_PRICE_ID
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

    // // Add debug logging
    // console.log("Received webhook event:", {
    //   type: event.type,
    //   id: event.id,
    //   object: event.data.object,
    // });
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
        console.log("Processing subscription webhook:", {
          subscriptionId: subscription.id,
          metadata: subscription.metadata,
        });
        await updateSubscription(subscription);
        break;

      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Processing checkout session webhook:", {
          sessionId: session.id,
          metadata: session.metadata,
        });
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await updateSubscription(subscription, session);
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}
