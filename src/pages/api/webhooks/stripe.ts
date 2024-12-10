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

function toDateTime(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

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
    plan_period: session?.metadata?.interval || "unknown",
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };

  // Check if this is a subscription update (like cancellation) or a new subscription
  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (existingSubscription) {
    // Update existing subscription
    const { error } = await supabase
      .from("subscriptions")
      .update(subscriptionData)
      .eq("stripe_subscription_id", subscriptionId);

    if (error) {
      console.error("Error updating subscription in Supabase:", error);
      throw error;
    }
  } else {
    // Insert new subscription
    const { error } = await supabase
      .from("subscriptions")
      .insert(subscriptionData);

    if (error) {
      console.error("Error inserting subscription in Supabase:", error);
      throw error;
    }
  }
}

function determinePlanType(priceId: string): "BASIC" | "PRO" {
  const planType =
    priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY_PRICE_ID ||
    priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_YEARLY_PRICE_ID
      ? "BASIC"
      : "PRO";
  return planType;
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
        const subscription = event.data.object;

        // First, check if subscription already exists
        const existingSubscription = await supabase
          .from("subscriptions")
          .select("*")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (existingSubscription.data) {
          // Update existing subscription instead of creating a new one
          await supabase
            .from("subscriptions")
            .update({
              status: subscription.status,
              metadata: subscription.metadata,
              price_id: subscription.items.data[0].price.id,
              quantity: subscription.items.data[0].quantity,
              cancel_at_period_end: subscription.cancel_at_period_end,
              cancel_at: subscription.cancel_at
                ? toDateTime(subscription.cancel_at).toISOString()
                : null,
              canceled_at: subscription.canceled_at
                ? toDateTime(subscription.canceled_at).toISOString()
                : null,
              current_period_start: toDateTime(
                subscription.current_period_start
              ).toISOString(),
              current_period_end: toDateTime(
                subscription.current_period_end
              ).toISOString(),
              created: toDateTime(subscription.created).toISOString(),
              ended_at: subscription.ended_at
                ? toDateTime(subscription.ended_at).toISOString()
                : null,
              trial_start: subscription.trial_start
                ? toDateTime(subscription.trial_start).toISOString()
                : null,
              trial_end: subscription.trial_end
                ? toDateTime(subscription.trial_end).toISOString()
                : null,
            })
            .eq("stripe_subscription_id", subscription.id);
        } else {
          // Create new subscription only if it doesn't exist
          await supabase.from("subscriptions").insert([
            {
              user_id: subscription.metadata.user_id,
              stripe_subscription_id: subscription.id,
              status: subscription.status,
              metadata: subscription.metadata,
              price_id: subscription.items.data[0].price.id,
              quantity: subscription.items.data[0].quantity,
              cancel_at_period_end: subscription.cancel_at_period_end,
              cancel_at: subscription.cancel_at
                ? toDateTime(subscription.cancel_at).toISOString()
                : null,
              canceled_at: subscription.canceled_at
                ? toDateTime(subscription.canceled_at).toISOString()
                : null,
              current_period_start: toDateTime(
                subscription.current_period_start
              ).toISOString(),
              current_period_end: toDateTime(
                subscription.current_period_end
              ).toISOString(),
              created: toDateTime(subscription.created).toISOString(),
              ended_at: subscription.ended_at
                ? toDateTime(subscription.ended_at).toISOString()
                : null,
              trial_start: subscription.trial_start
                ? toDateTime(subscription.trial_start).toISOString()
                : null,
              trial_end: subscription.trial_end
                ? toDateTime(subscription.trial_end).toISOString()
                : null,
            },
          ]);
        }
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
