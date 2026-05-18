import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PricingCard from "./PricingCard";
import api from "../api";
import cache from "../cache";

const AccountBuyPlan = () => {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch plans from backend
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // cache support
        if (cache.plans) {
          setPlans(cache.plans);
          setLoading(false);
        }

        const response = await api.get("/plans");

        const fetchedPlans = Array.isArray(response.data)
          ? response.data
          : [];

        setPlans(fetchedPlans);

        // save cache
        cache.plans = fetchedPlans;
      } catch (error) {
        console.error("Failed to fetch plans:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  return (
    <div className="w-full py-4 px-2 sm:px-4" data-aos="fade-up">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">
            Buy Plan
          </h2>

          <p className="text-gray-400 mt-2 max-w-2xl">
            Choose a membership plan and continue to purchase.
          </p>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center text-gray-400 py-10">
            Loading plans...
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <PricingCard
                key={plan.id}
                service={plan}
                index={index}
                hasActivePlan={false}
                checkingPlan={false}
                onChoose={(selectedPlan) =>
                  navigate("/buy-plan-dummy", {
                    state: {
                      plan: selectedPlan,
                    },
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountBuyPlan;