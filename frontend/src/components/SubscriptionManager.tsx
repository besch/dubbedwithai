import { useState } from "react";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
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

interface SubscriptionManagerProps {
  subscription: Subscription;
  onCancel: () => Promise<void>;
  onReactivate: () => Promise<void>;
}

export default function SubscriptionManager({
  subscription,
  onCancel,
  onReactivate,
}: SubscriptionManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAction = async (action: "cancel" | "reactivate") => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (action === "cancel") {
        await onCancel();
        setSuccess("Subscription successfully canceled");
      } else {
        await onReactivate();
        setSuccess("Subscription successfully reactivated");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const planDetails =
    PRICING_PLANS[subscription.plan_type as keyof typeof PRICING_PLANS];

  return (
    <div className="bg-muted rounded-lg p-6 space-y-6">
      {/* Status Banner */}
      <div
        className={`rounded-md p-4 ${
          subscription.cancel_at_period_end
            ? "bg-yellow-900/20 border border-yellow-900"
            : "bg-green-900/20 border border-green-900"
        }`}
      >
        <div className="flex items-center">
          {subscription.cancel_at_period_end ? (
            <AlertCircle className="text-yellow-400 mr-3" />
          ) : (
            <CheckCircle className="text-green-400 mr-3" />
          )}
          <div>
            <h3 className="text-sm font-medium">
              {subscription.cancel_at_period_end
                ? "Subscription Scheduled to Cancel"
                : "Subscription Active"}
            </h3>
            <p className="text-sm mt-1 opacity-90">
              {subscription.cancel_at_period_end
                ? `Your subscription will end on ${new Date(
                    subscription.current_period_end
                  ).toLocaleDateString()}`
                : `Your next billing date is ${new Date(
                    subscription.current_period_end
                  ).toLocaleDateString()}`}
            </p>
          </div>
        </div>
      </div>

      {/* Plan Details */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">
            {subscription.plan_type} Plan
          </h3>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
            {subscription.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm opacity-70">Billing Period</p>
            <p className="font-medium">
              {new Date(subscription.current_period_start).toLocaleDateString()}{" "}
              - {new Date(subscription.current_period_end).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-70">Monthly Price</p>
            <p className="font-medium">
              ${planDetails?.price.monthly.toFixed(2)}/month
            </p>
          </div>
          <div>
            <p className="text-sm opacity-70">Generations</p>
            <p className="font-medium">
              {planDetails?.generations === Infinity
                ? "Unlimited"
                : planDetails?.generations}{" "}
              per {planDetails?.period}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        {error && (
          <div className="bg-red-900/20 border border-red-900 rounded-md p-3 flex items-center text-sm">
            <XCircle className="text-red-400 mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/20 border border-green-900 rounded-md p-3 flex items-center text-sm">
            <CheckCircle className="text-green-400 mr-2" />
            {success}
          </div>
        )}
        {subscription.cancel_at_period_end ? (
          <button
            onClick={() => handleAction("reactivate")}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Reactivate Subscription"}
          </button>
        ) : (
          <button
            onClick={() => handleAction("cancel")}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Cancel Subscription"}
          </button>
        )}
      </div>
    </div>
  );
}
