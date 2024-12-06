import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import SubscriptionManager from "@/components/SubscriptionManager";
import { ArrowRight, Clock } from "lucide-react";

interface Subscription {
  id: string;
  plan_type: string;
  status: string;
  current_period_end: string;
  current_period_start: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
  created_at: string;
}

export default function Subscriptions() {
  const user = useAppSelector((state) => state.user.user);
  const loading = useAppSelector((state) => state.user.loading);
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for the user state to be loaded
    if (loading) return;

    // If no user is found after loading, redirect to pricing
    if (!user && !loading) {
      router.push('/pricing');
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

        // Fetch usage
        const { data: usageData } = await supabase
          .from("api_logs")
          .select("*")
          .eq("endpoint", "/api/generate-audio");

        if (mounted) {
          setUsage(usageData?.length || 0);
        }
      } catch (error) {
        console.error("Error fetching subscription data:", error);
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
      const response = await fetch("/api/cancel-subscription", {
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
      const response = await fetch("/api/reactivate-subscription", {
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
        <a
          href="/pricing"
          className="text-yellow-400 hover:text-yellow-500 flex items-center"
        >
          View Plans <ArrowRight className="ml-2 h-4 w-4" />
        </a>
      </div>

      {/* Active Subscription */}
      {activeSubscription ? (
        <SubscriptionManager
          subscription={activeSubscription}
          onCancel={handleCancelSubscription}
          onReactivate={handleReactivateSubscription}
        />
      ) : (
        <div className="bg-muted p-6 rounded-lg mb-8 text-center">
          <p className="mb-4">You don&apos;t have any active subscriptions.</p>
          <a
            href="/pricing"
            className="inline-block px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 transition-colors"
          >
            View Pricing Plans
          </a>
        </div>
      )}

      {/* Usage Statistics */}
      <div className="bg-muted p-6 rounded-lg mb-8 mt-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Clock className="mr-2" /> Usage Statistics
        </h2>
        <p className="text-xl">Total Audio Generations: {usage}</p>
      </div>

      {/* Subscription History */}
      {subscriptions.length > 1 && (
        <div className="bg-muted p-6 rounded-lg mt-8">
          <h2 className="text-2xl font-semibold mb-4">Subscription History</h2>
          <div className="space-y-4">
            {subscriptions
              .filter((sub) => sub.id !== activeSubscription?.id)
              .map((sub) => (
                <div
                  key={sub.id}
                  className="border border-gray-700 rounded-md p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold">{sub.plan_type}</p>
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
                  <p className="text-sm opacity-70">
                    {new Date(sub.current_period_start).toLocaleDateString()} -{" "}
                    {new Date(sub.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
