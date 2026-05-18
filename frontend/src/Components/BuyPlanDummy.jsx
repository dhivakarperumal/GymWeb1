import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PricingCard from "./PricingCard";

const BuyPlanDummy = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const plan = state?.plan || {
    name: "Selected Plan",
    description: "This page is a placeholder for the plan purchase flow.",
    duration: "3 Months",
    final_price: 9999,
    features: [
      "Personal training guidance",
      "Structured workout plan",
      "Nutrition support",
      "Weekly progress checks",
    ],
  };

  return (
    <div className="bg-black text-white min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-red-500 mb-3">Buy Plan Preview</p>
          <h1 className="text-4xl font-bold text-white">Plan Selection Placeholder</h1>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            This is a dummy page for the next step in the buy plan workflow. The selected plan is shown below.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <div className="bg-gray-900/70 border border-white/10 rounded-3xl p-8 shadow-xl">
              <h2 className="text-3xl font-bold text-white mb-4">{plan.name}</h2>
              <p className="text-gray-400 mb-6">{plan.description}</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/60 p-4 rounded-2xl border border-white/10">
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-2">Duration</p>
                  <p className="text-lg font-semibold text-white">{plan.duration}</p>
                </div>
                <div className="bg-black/60 p-4 rounded-2xl border border-white/10">
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-2">Price</p>
                  <p className="text-lg font-semibold text-red-500">₹{plan.final_price?.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">Plan Highlights</p>
                <ul className="space-y-2 text-gray-300">
                  {plan.features?.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/account", { state: { tab: "plans" } })}
                className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 transition font-semibold"
              >
                Back to Buy Plan
              </button>
              <button
                disabled
                className="px-6 py-3 rounded-full bg-white/10 text-white opacity-60 cursor-not-allowed"
              >
                Continue (Dummy)
              </button>
            </div>
          </div>

          <div>
            <PricingCard
              service={plan}
              index={0}
              hasActivePlan={true}
              checkingPlan={false}
              onChoose={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyPlanDummy;
