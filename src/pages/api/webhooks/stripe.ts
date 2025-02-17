import { buffer } from 'micro';
import { NextApiRequest, NextApiResponse } from "next";
import stripe from "@/lib/stripeClient";
import Stripe from "stripe";
import supabase from "@/lib/supabaseAdmin";

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

  // Get the price ID and interval to determine the plan type and period
  const priceId = subscription.items.data[0].price.id;
  const interval = subscription.items.data[0].price.recurring?.interval || 
                  session?.metadata?.interval || 
                  'month';

  // Get plan details from plan_limits table
  const { data: planLimit } = await supabase
    .from('plan_limits')
    .select('*')
    .eq('stripe_price_id', priceId)
    .single();

  if (!planLimit) {
    throw new Error(`No plan found for price ID: ${priceId}`);
  }

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
    plan_type: planLimit.name.split('_')[0],
    plan_period: interval,
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

async function cancelExistingSubscriptions(userId: string, newSubscriptionId: string) {
  try {
    // Get all active subscriptions for the user except the new one
    const { data: activeSubscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .neq("stripe_subscription_id", newSubscriptionId);

    if (!activeSubscriptions?.length) return;

    // Cancel each active subscription in Stripe and update in Supabase
    for (const subscription of activeSubscriptions) {
      try {
        await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.stripe_subscription_id);
      } catch (error) {
        console.error(`Error canceling subscription ${subscription.stripe_subscription_id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in cancelExistingSubscriptions:", error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  try {
    const event = stripe.webhooks.constructEvent(
      buf,
      sig,
      webhookSecret
    );

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0].price.id;
        
        // Get plan type from price ID
        const { data: planLimit } = await supabase
          .from('plan_limits')
          .select('plan_type')
          .eq('stripe_price_id', priceId)
          .single();

        if (!planLimit) {
          throw new Error(`No plan found for price ID: ${priceId}`);
        }

        await supabase
          .from('subscriptions')
          .upsert({
            user_id: subscription.metadata.user_id,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            plan_type: planLimit.plan_type,
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end,
            status: subscription.status
          });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date()
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription && session.metadata?.userId) {
          // Cancel existing subscriptions when checkout is completed
          await cancelExistingSubscriptions(
            session.metadata.userId,
            session.subscription as string
          );
          
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await updateSubscription(subscription, session);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        // Handle successful payment
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).json({
      error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`
    });
  }
}
