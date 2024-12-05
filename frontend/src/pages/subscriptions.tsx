import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/router";

interface Subscription {
  plan_type: string;
  status: string;
  current_period_end: string;
}

export default function Subscriptions() {
  const user = useAppSelector((state) => state.user.user);
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    async function fetchSubscription() {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (!error && data) {
        setSubscription(data);
      }
      setLoading(false);
    }

    fetchSubscription();
  }, [user, router]);

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Your Subscription</h1>
      {subscription ? (
        <div className="bg-muted p-6 rounded-lg">
          <p className="text-xl mb-4">Current Plan: {subscription.plan_type}</p>
          <p className="mb-4">Status: {subscription.status}</p>
          <p>
            Current Period Ends:{" "}
            {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <div className="bg-muted p-6 rounded-lg">
          <p>You don&apos;t have any active subscriptions.</p>
          <a href="/pricing" className="text-yellow-400 hover:underline">
            View our pricing plans
          </a>
        </div>
      )}
    </div>
  );
}
