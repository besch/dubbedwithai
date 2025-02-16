import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import SubscriptionManager from "@/components/SubscriptionManager";
import { ArrowRight, Clock } from "lucide-react";
import { PRICING_PLANS } from "@/config/pricing";
import Link from "next/link";
import { Subscription } from "@/types";

export default function Subscriptions() {
  const user = useAppSelector((state) => state.user.user);
  const loading = useAppSelector((state) => state.user.loading);
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeSubscription, setActiveSubscription] =
    useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ipUsage, setIpUsage] = useState<{
    count: number;
    reset_at: string | null;
  } | null>(null);

  useEffect(() => {
    // Wait for the user state to be loaded
    if (loading) return;

    // If no user is found after loading, redirect to pricing
    if (!user && !loading) {
      router.push("/pricing");
      return;
    }

    let mounted = true;

    async function fetchData() {
      if (!user) return;

      try {
        // Fetch all subscriptions
        const { data: subsData } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (subsData && mounted) {
          setSubscriptions(subsData);
          const active = subsData.find((sub) => sub.status === "active");
          setActiveSubscription(active || null);
        }

        // Fetch IP-based usage
        const ipAddress = await fetch("https://api.ipify.org?format=json")
          .then((res) => res.json())
          .then((data) => data.ip);

        const { data: usageData } = await supabase
          .from("audio_generation_usage")
          .select("*")
          .eq("ip_address", ipAddress)
          .single();

        if (mounted && usageData) {
          setIpUsage({
            count: usageData.count,
            reset_at: usageData.reset_at,
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [user, loading, router]);

  const refreshSubscriptionData = async () => {
    if (!user) return;

    try {
      // Fetch all subscriptions
      const { data: subsData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (subsData) {
        setSubscriptions(subsData);
        const active = subsData.find((sub) => sub.status === "active");
        setActiveSubscription(active || null);
      }
    } catch (error) {
      console.error("Error refreshing subscription data:", error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription?.stripe_subscription_id) return;

    try {
      const response = await fetch("/api/subscription/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: activeSubscription.stripe_subscription_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      // Refresh the subscription data instead of reloading the page
      await refreshSubscriptionData();
    } catch (error) {
      console.error("Error canceling subscription:", error);
      throw error;
    }
  };

  const handleReactivateSubscription = async () => {
    if (!activeSubscription?.stripe_subscription_id) return;

    try {
      const response = await fetch("/api/subscription/reactivate-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: activeSubscription.stripe_subscription_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reactivate subscription");
      }

      // Refresh the subscription data instead of reloading the page
      await refreshSubscriptionData();
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      throw error;
    }
  };

  const handleReactivateFromHistory = async (subscriptionId: string) => {
    try {
      const response = await fetch("/api/reactivate-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscriptionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reactivate subscription");
      }

      await refreshSubscriptionData();
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      throw error;
    }
  };

  // Add this function to format the date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Show loading state while checking authentication
  if (loading || isLoading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user is found and loading is complete, the useEffect will handle the redirect
  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Subscription Management</h1>
        <Link
          href="/pricing"
          className="text-yellow-400 hover:text-yellow-500 flex items-center"
        >
          View Plans <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {/* Active Subscription or No Subscription Message */}
      {activeSubscription ? (
        <SubscriptionManager
          subscription={activeSubscription}
          onCancel={handleCancelSubscription}
          onReactivate={handleReactivateSubscription}
        />
      ) : (
        <div className="bg-muted p-6 rounded-lg mb-8 text-center">
          <p className="mb-4">You don&apos;t have any active subscriptions.</p>
          {subscriptions.length > 0 ? (
            <p className="text-sm text-gray-400 mb-4">
              You can reactivate your previous subscription from the history
              below or choose a new plan.
            </p>
          ) : null}
          <Link
            href="/pricing"
            className="inline-block px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition-colors"
          >
            View Pricing Plans
          </Link>
        </div>
      )}

      {/* Usage Statistics */}
      <div className="bg-muted p-6 rounded-lg mb-8 mt-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Clock className="mr-2" /> Usage Statistics
        </h2>
        <div className="space-y-2">
          {ipUsage && (
            <>
              <p className="text-xl">
                Total Audio Generations: {ipUsage.count}
              </p>
              {ipUsage.reset_at && (
                <p className="text-sm text-gray-400">
                  Resets on: {new Date(ipUsage.reset_at).toLocaleDateString()}
                </p>
              )}
              {!activeSubscription && (
                <p className="text-sm text-gray-400">
                  Free tier limit: {PRICING_PLANS.FREE.generations} generations
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Updated Subscription History */}
      <div className="bg-muted p-6 rounded-lg mt-8">
        <h2 className="text-2xl font-semibold mb-4">Subscription History</h2>
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="border border-gray-700 rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h3 className="font-semibold text-lg">
                    {sub.plan_type}{" "}
                    <span className="capitalize">{sub.plan_period}</span> Plan
                  </h3>
                  <p className="text-sm text-gray-400">
                    Created: {formatDate(sub.created_at)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    sub.status === "active"
                      ? "bg-green-900/20 text-green-400"
                      : "bg-gray-900/20 text-gray-400"
                  }`}
                >
                  {sub.status}
                </span>
              </div>

              <div className="mt-2 space-y-1 text-sm text-gray-400">
                <p>
                  Period: {formatDate(sub.current_period_start)} -{" "}
                  {formatDate(sub.current_period_end)}
                </p>
                {sub.cancel_at_period_end && (
                  <p className="text-yellow-400">
                    Scheduled to cancel on {formatDate(sub.current_period_end)}
                  </p>
                )}
                <p>Last updated: {formatDate(sub.updated_at)}</p>
              </div>

              {/* Add Reactivate Button for canceled subscriptions */}
              {!activeSubscription &&
                sub === subscriptions[0] && // Show button only for the most recent subscription
                (sub.status === "canceled" ||
                  (sub.status === "active" && sub.cancel_at_period_end)) && (
                  <div className="mt-4">
                    <button
                      onClick={() =>
                        handleReactivateFromHistory(sub.stripe_subscription_id)
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                    >
                      Reactivate This Plan
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
