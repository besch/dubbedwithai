import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import supabase from "@/lib/supabaseClient";
import { useRouter } from "next/router";
import { LogEntry } from "@/lib/logApiRequest";

interface Subscription {
  plan_type: string;
  status: string;
  current_period_end: string;
}

export default function Subscriptions() {
  const user = useAppSelector((state) => state.user.user);
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    async function fetchData() {
      // Fetch subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (subData) {
        setSubscription(subData);
      }

      // Fetch usage from api_logs
      const { data: userData } = await supabase
        .from("users")
        .select("ip_address")
        .eq("id", user!.id)
        .single();

      if (userData?.ip_address) {
        const { data: usageData } = await supabase
          .from("api_logs")
          .select("*")
          .eq("ip_address", userData.ip_address)
          .eq("endpoint", "/api/generate-audio");

        const count = usageData ? usageData.length : 0;
        console.log(`Count of entries for /api/generate-audio: ${count}`);
        setUsage(count);
      }

      setLoading(false);
    }

    fetchData();
  }, [user, router]);

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Your Subscription</h1>

      {subscription ? (
        <div className="bg-muted p-6 rounded-lg mb-8">
          <p className="text-xl mb-4">Current Plan: {subscription.plan_type}</p>
          <p className="mb-4">Status: {subscription.status}</p>
          <p>
            Current Period Ends:{" "}
            {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <div className="bg-muted p-6 rounded-lg mb-8">
          <p>You don&apos;t have any active subscriptions.</p>
          <a href="/pricing" className="text-yellow-400 hover:underline">
            View our pricing plans
          </a>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Usage History</h2>
      <div className="bg-muted p-6 rounded-lg">
        <p className="text-xl">Used audio generations: {usage}</p>
      </div>
    </div>
  );
}
