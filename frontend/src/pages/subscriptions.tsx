import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import { PRICING_PLANS } from "@/config/pricing";

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
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [activeSubscription, setActiveSubscription] =
    useState<Subscription | null>(null);
  const [usage, setUsage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    async function fetchData() {
      // Fetch all subscriptions
      const { data: subsData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (subsData) {
        setSubscriptions(subsData);
        const active = subsData.find((sub) => sub.status === "active");
        setActiveSubscription(active || null);
      }

      // Fetch usage
      const { data: usageData } = await supabase
        .from("api_logs")
        .select("*")
        .eq("endpoint", "/api/generate-audio");

      setUsage(usageData?.length || 0);
      setLoading(false);
    }

    fetchData();
  }, [user, router]);

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

      if (!response.ok) throw new Error("Failed to cancel subscription");

      // Refresh the page to show updated status
      router.reload();
    } catch (error) {
      console.error("Error canceling subscription:", error);
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

      if (!response.ok) throw new Error("Failed to reactivate subscription");

      // Refresh the page to show updated status
      router.reload();
    } catch (error) {
      console.error("Error reactivating subscription:", error);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Subscription Management</h1>

      {/* Active Subscription */}
      {activeSubscription ? (
        <div className="bg-muted p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Current Subscription</h2>
          <div className="space-y-2">
            <p className="text-xl">Plan: {activeSubscription.plan_type}</p>
            <p>Status: {activeSubscription.status}</p>
            <p>
              Current Period:{" "}
              {new Date(
                activeSubscription.current_period_start
              ).toLocaleDateString()}{" "}
              -{" "}
              {new Date(
                activeSubscription.current_period_end
              ).toLocaleDateString()}
            </p>
            {activeSubscription.cancel_at_period_end ? (
              <div className="mt-4 space-y-2">
                <p className="text-yellow-400">
                  Your subscription will end on{" "}
                  {new Date(
                    activeSubscription.current_period_end
                  ).toLocaleDateString()}
                </p>
                <button
                  onClick={handleReactivateSubscription}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  Reactivate Subscription
                </button>
              </div>
            ) : (
              <button
                onClick={handleCancelSubscription}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-muted p-6 rounded-lg mb-8">
          <p>You don&apos;t have any active subscriptions.</p>
          <a href="/pricing" className="text-yellow-400 hover:underline">
            View our pricing plans
          </a>
        </div>
      )}

      {/* Usage Statistics */}
      <div className="bg-muted p-6 rounded-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4">Usage Statistics</h2>
        <p className="text-xl">Total Audio Generations: {usage}</p>
      </div>

      {/* Subscription History */}
      {subscriptions.length > 1 && (
        <div className="bg-muted p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Subscription History</h2>
          <div className="space-y-4">
            {subscriptions
              .filter((sub) => sub.id !== activeSubscription?.id)
              .map((sub) => (
                <div key={sub.id} className="border-b border-gray-700 pb-4">
                  <p className="font-semibold">{sub.plan_type}</p>
                  <p>Status: {sub.status}</p>
                  <p>
                    Period:{" "}
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
