import React from "react";
import { useNavigate } from "react-router-dom";
import PricingCard from "./PricingCard";

const accountPlans = [
  {
    id: "account-1",
    name: "3 Month Transformation",
    description: "A structured 3-month program with workouts, nutrition, and support.",
    duration: "3 Months",
    final_price: 7999,
    features: [
      "Gym access 7 days a week",
      "Personalized diet plan",
      "Weekly progress check-ins",
      "Trainer support via chat",
    ],
  },
  {
    id: "account-2",
    name: "6 Month Strength Plan",
    description: "Build strength and consistency with a six-month routine.",
    duration: "6 Months",
    final_price: 14999,
    features: [
      "Strength training focus",
      "Meal guidance",
      "Monthly body assessments",
      "Recovery and mobility tips",
    ],
  },
  {
    id: "account-3",
    name: "12 Month Elite Plan",
    description: "Long-term membership for serious fitness commitment.",
    duration: "12 Months",
    final_price: 24999,
    features: [
      "Premium member access",
      "Advanced workout plans",
      "Regular nutrition coaching",
      "Exclusive member events",
    ],
  },
];

const AccountBuyPlan = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full py-4 px-2 sm:px-4" data-aos="fade-up">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">Buy Plan</h2>
          <p className="text-gray-400 mt-2 max-w-2xl">
            Choose a plan and continue to the purchase flow. This is a dedicated buy plan section separate from your existing plans.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {accountPlans.map((plan, index) => (
            <PricingCard
              key={plan.id}
              service={plan}
              index={index}
              hasActivePlan={false}
              checkingPlan={false}
              onChoose={() => navigate("/buy-plan-dummy", { state: { plan } })}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountBuyPlan;
