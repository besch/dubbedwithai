import Head from "next/head";
import { Check } from "lucide-react";
import { useState } from "react";
import { PRICING_PLANS } from "@/config/pricing";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);

interface PricingTierProps {
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

const PricingTier: React.FC<PricingTierProps> = ({
  name,
  price,
  features,
  popular = false,
}) => (
  <div
    className={`bg-muted p-8 rounded-lg shadow-lg flex flex-col h-full ${
      popular ? "border-2 border-yellow-400" : ""
    }`}
  >
    <h3 className="text-2xl font-bold mb-4">{name}</h3>
    <p className="text-4xl font-bold mb-6">
      ${price}
      <span className="text-lg font-normal">/month</span>
    </p>
    <ul className="space-y-3 mb-8 flex-grow">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center">
          <Check className="w-5 h-5 mr-2 text-green-500" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <button
      className={`mt-auto w-full py-2 px-4 rounded-md transition-colors ${
        popular
          ? "bg-yellow-400 text-black hover:bg-yellow-500"
          : "bg-primary text-white hover:bg-opacity-90"
      }`}
    >
      Choose Plan
    </button>
  </div>
);

const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState<boolean>(false);

  const pricingPlans: PricingTierProps[] = [
    {
      name: PRICING_PLANS.FREE.name,
      price: 0,
      features: [
        `Up to ${PRICING_PLANS.FREE.generations} dubbing generations per ${PRICING_PLANS.FREE.period}`,
      ],
    },
    {
      name: PRICING_PLANS.BASIC.name,
      price: isYearly
        ? PRICING_PLANS.BASIC.price.yearly / 12
        : PRICING_PLANS.BASIC.price.monthly,
      features: [
        `${PRICING_PLANS.BASIC.generations} dubbing generations per ${PRICING_PLANS.BASIC.period}`,
      ],
      popular: true,
    },
    {
      name: PRICING_PLANS.PRO.name,
      price: isYearly
        ? PRICING_PLANS.PRO.price.yearly / 12
        : PRICING_PLANS.PRO.price.monthly,
      features: [
        `${PRICING_PLANS.PRO.generations} dubbing generations per ${PRICING_PLANS.PRO.period}`,
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>OneDub Pricing - AI-Powered Movie Dubbing Plans</title>
        <meta
          name="description"
          content="Choose the perfect OneDub plan for your AI movie dubbing needs. From free daily dubbing to unlimited power user options."
        />
      </Head>
      <div className="bg-background text-foreground py-20">
        <div className="container mx-auto">
          <h1 className="text-5xl font-bold mb-12 text-center text-yellow-400">
            Choose Your OneDub Plan
          </h1>
          <p className="text-xl text-center mb-12 max-w-2xl mx-auto">
            Select the perfect plan to unlock the power of AI dubbing and enjoy
            your favorite content in any language.
          </p>
          <div className="flex justify-center mb-12">
            <button
              className={`px-4 py-2 rounded-l-md transition-colors ${
                !isYearly
                  ? "bg-yellow-400 text-black"
                  : "bg-muted text-foreground"
              }`}
              onClick={() => setIsYearly(false)}
            >
              Monthly
            </button>
            <button
              className={`px-4 py-2 rounded-r-md transition-colors ${
                isYearly
                  ? "bg-yellow-400 text-black"
                  : "bg-muted text-foreground"
              }`}
              onClick={() => setIsYearly(true)}
            >
              Yearly (Save 20%)
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <PricingTier key={index} {...plan} />
            ))}
          </div>
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  What happens if I exceed the free plan limit?
                </h3>
                <p>
                  Once you reach the 1,500 daily dubbing limit on the free plan,
                  you&apos;ll need to wait until the next day or upgrade to a
                  paid plan for unlimited dubbing.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Can I switch between monthly and yearly billing?
                </h3>
                <p>
                  Yes, you can switch between monthly and yearly billing at any
                  time. Yearly billing offers a 20% discount compared to monthly
                  billing.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  What payment methods do you accept?
                </h3>
                <p>
                  We accept all major credit cards, PayPal, and cryptocurrency
                  payments for your convenience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;
