import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../src/PrivateRouter/AuthContext";
import api from "../../src/api";
import PricingCard from "../Components/PricingCard";

const dummyPlans = [
  {
    id: "dummy-1",
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
    id: "dummy-2",
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
    id: "dummy-3",
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

const MemberSBuyPlans = ({ preFetchedPlans }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plans, setPlans] = useState(preFetchedPlans || []);
  const [loading, setLoading] = useState(!preFetchedPlans);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get("/products");
        const list = Array.isArray(res.data) ? res.data : [];
        setFeaturedProducts(list.slice(0, 4));
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchFeatured();

    if (!user?.id || preFetchedPlans) return;

    const fetchMemberships = async () => {
      try {
        const res = await api.get(`/memberships/user/${user.id}`);

        setPlans(res.data || []);
      } catch (err) {
        console.error("Failed to fetch memberships", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberships();
  }, [user, preFetchedPlans]);

  const activePlan = plans.find((plan) => plan.status === "active");
  const showDummyPlans = !activePlan;

  return (
    <>
      <div className="bg-black text-white min-h-screen py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-red-500">
            {showDummyPlans ? "Buy a Plan" : "My Plans"}
          </h2>

          <p className="text-gray-400 mt-2">
            {showDummyPlans
              ? "Choose a membership plan to start your fitness journey."
              : "Your purchased membership plan details."}
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-4 bg-gray-800 w-32 mb-4 rounded"></div>
              <div className="h-2 bg-gray-800 w-48 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 px-4">
            {(showDummyPlans ? dummyPlans : plans).map((plan) => {
              const service = {
                name: plan.planName || plan.name || plan.name || "Membership Plan",
                description:
                  plan.description || plan.planName || "Choose this plan to continue.",
                duration: plan.duration || plan.duration_months || "1 Month",
                final_price:
                  plan.pricePaid || plan.final_price || plan.price || plan.pricePaid || 0,
                features:
                  plan.features ||
                  plan.facilities ||
                  [
                    "Gym access",
                    "Personalized support",
                    "Diet guidance",
                    "Progress tracking",
                  ],
              };

              return (
                <PricingCard
                  key={plan.id}
                  service={service}
                  index={0}
                  hasActivePlan={false}
                  checkingPlan={false}
                  onChoose={() => {
                    navigate("/buy-plan-dummy", { state: { plan: service } });
                  }}
                />
              );
            })}
          </div>
        )}

        {/* FEATURED PRODUCTS SECTION ("products all show") */}
        <div className="mt-24 px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white">Supplements & Gear</h3>
              <p className="text-gray-400 text-sm">Boost your performance with our top-rated products</p>
            </div>
            <button 
              onClick={() => navigate("/products")}
              className="text-red-500 font-bold hover:underline text-sm"
            >
              View Shop
            </button>
          </div>
          
          {/* We'll just show a couple of placeholders or fetch them if needed */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((prod) => (
                <div 
                  key={prod.id} 
                  onClick={() => navigate("/products")}
                  className="bg-gray-900/40 border border-white/5 p-4 rounded-xl text-center cursor-pointer hover:border-red-500/30 transition group"
                >
                  <div className="w-full aspect-square bg-gray-800 rounded-lg mb-3 overflow-hidden">
                    <img 
                      src={prod.image || prod.images?.[0] || "https://via.placeholder.com/150"} 
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      alt={prod.name}
                    />
                  </div>
                  <p className="text-sm font-bold text-white truncate">{prod.name}</p>
                  <p className="text-xs text-red-500 font-black mt-1">
                    ₹{prod.offer_price || prod.offerPrice || prod.mrp || "0"}
                  </p>
                </div>
              ))
            ) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-900/40 border border-white/5 p-4 rounded-xl text-center">
                  <div className="w-full aspect-square bg-gray-800 rounded-lg mb-3 animate-pulse"></div>
                  <div className="h-3 bg-gray-800 w-2/3 mx-auto mb-2 rounded"></div>
                  <div className="h-2 bg-gray-800 w-1/3 mx-auto rounded"></div>
                </div>
              ))
            )}
          </div>
        </div>


      </div>
    </>
  );
};

export default MemberSBuyPlans;