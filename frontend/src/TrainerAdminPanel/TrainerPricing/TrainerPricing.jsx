import React, { useEffect, useState } from "react";
import {
  Zap,
  Users,
  TrendingUp,
  Check,
  X,
  Search,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api";
import cache from "../../cache";

/* ================= STYLES ================= */
const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]";

const glassInput =
  "w-full bg-gray-800 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50";

/* ================= COMPONENT ================= */
const TrainerPricing = () => {
  const [plans, setPlans] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  /* ================= LOAD PLANS ================= */
  const loadPlans = async () => {
    if (cache.plans) {
      setPlans(cache.plans.map((p) => ({ id: p.id, ...p })));
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get("/plans");
      const data = res.data || [];
      const mappedData = data.map((p) => ({ id: p.id, ...p }));
      setPlans(mappedData);
      cache.plans = mappedData;
    } catch (err) {
      console.error(err);
      if (!cache.plans) toast.error("Failed to load pricing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  /* ================= FILTER PLANS ================= */
  const filteredPlans = plans.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filter === "all" ||
      (filter === "active" && p.active) ||
      (filter === "inactive" && !p.active);
    return matchSearch && matchStatus;
  });

  /* ================= STATS ================= */
  const stats = {
    total: plans.length,
    active: plans.filter((p) => p.active).length,
    trainerIncluded: plans.filter((p) => p.trainerIncluded).length,
    avgPrice: plans.length
      ? Math.floor(
          plans.reduce((sum, p) => sum + (p.finalPrice || p.final_price || p.price || 0), 0) /
            plans.length
        )
      : 0,
  };

  return (
    <div className="min-h-screen text-white space-y-8">
      {/* ========== HEADER ========== */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          Pricing Strategy
        </h1>
        <p className="text-white/60">
          Manage and monitor all membership plans and pricing tiers
        </p>
      </div>

      {/* ========== STATS GRID ========== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL PLANS */}
        <div
          className={`${glassCard} p-6 space-y-3 hover:border-orange-500/50 transition group cursor-pointer`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/80">Total Plans</h3>
            <div className="p-3 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-400">{stats.total}</p>
          <p className="text-xs text-white/50">All pricing tiers</p>
        </div>

        {/* ACTIVE PLANS */}
        <div
          className={`${glassCard} p-6 space-y-3 hover:border-emerald-500/50 transition group cursor-pointer`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/80">Active Plans</h3>
            <div className="p-3 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{stats.active}</p>
          <p className="text-xs text-white/50">Currently available</p>
        </div>

        {/* TRAINER INCLUDED */}
        <div
          className={`${glassCard} p-6 space-y-3 hover:border-cyan-500/50 transition group cursor-pointer`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/80">Trainer Plans</h3>
            <div className="p-3 rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-cyan-400">{stats.trainerIncluded}</p>
          <p className="text-xs text-white/50">Trainer included</p>
        </div>

        {/* AVG PRICE */}
        <div
          className={`${glassCard} p-6 space-y-3 hover:border-purple-500/50 transition group cursor-pointer`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/80">Average Price</h3>
            <div className="p-3 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-400">₹{stats.avgPrice}</p>
          <p className="text-xs text-white/50">Across all plans</p>
        </div>
      </div>

      {/* ========== FILTERS ========== */}
      <div className={`${glassCard} p-5 space-y-4`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* SEARCH */}
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
            <input
              placeholder="Search plans..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${glassInput} pl-11`}
            />
          </div>

          {/* FILTER */}
          <div className="w-full md:w-1/3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={glassInput}
            >
              <option value="all">All Plans</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* INFO */}
        <p className="text-xs text-white/60">
          Showing {filteredPlans.length} of {plans.length} plans
        </p>
      </div>

      {/* ========== PRICING CARDS ========== */}
      {loading && !cache.plans ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white/5 rounded-3xl border border-white/10 mt-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full animate-pulse" />
          </div>
          <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">
            Loading Pricing Data
          </p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/60 text-lg">No plans found</p>
          <p className="text-white/40 text-sm mt-2">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan, idx) => (
            <PricingCard key={plan.id} plan={plan} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ================= PRICING CARD COMPONENT ================= */
function PricingCard({ plan, index }) {
  const price = plan.finalPrice || plan.final_price || plan.price || 0;
  const originalPrice = plan.price;
  const discount = plan.discount || 0;

  return (
    <div
      className={`${glassCard} p-6 space-y-5 group hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_30px_80px_rgba(255,69,0,0.2)]`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
          <p className="text-sm text-white/60">{plan.description || "Premium plan"}</p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            plan.active
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-gray-500/20 text-gray-400"
          }`}
        >
          {plan.active ? "Active" : "Inactive"}
        </div>
      </div>

      {/* PRICING */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-orange-400">₹{price}</span>
          {discount > 0 && (
            <span className="text-sm font-medium px-2 py-1 rounded bg-orange-500/20 text-orange-300">
              {discount}% OFF
            </span>
          )}
        </div>
        {originalPrice && originalPrice !== price && (
          <p className="text-sm text-white/40 line-through">₹{originalPrice}</p>
        )}
        <p className="text-sm text-white/70">
          Duration: <span className="font-semibold">{plan.duration || plan.duration_months || "1"} months</span>
        </p>
      </div>

      {/* DIVIDER */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* TRAINER STATUS */}
      <div className="flex items-center gap-2">
        {plan.trainerIncluded ? (
          <>
            <Check className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Trainer Included</span>
          </>
        ) : (
          <>
            <X className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-400">Trainer Not Included</span>
          </>
        )}
      </div>

      {/* FACILITIES */}
      {plan.facilities && plan.facilities.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            Facilities Included
          </p>
          <ul className="space-y-2">
            {plan.facilities.slice(0, 4).map((facility, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                <Check className="w-4 h-4 text-orange-400" />
                <span>{facility}</span>
              </li>
            ))}
            {plan.facilities.length > 4 && (
              <li className="text-xs text-white/50 italic pl-6">
                +{plan.facilities.length - 4} more facilities
              </li>
            )}
          </ul>
        </div>
      )}

      {/* FEATURES */}
      {plan.features && plan.features.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">
            Key Features
          </p>
          <ul className="space-y-1">
            {plan.features.slice(0, 3).map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-white/60 text-xs mb-1">Duration</p>
          <p className="text-lg font-bold text-white">
            {plan.duration || plan.duration_months}M
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-white/60 text-xs mb-1">Price Point</p>
          <p className="text-lg font-bold text-orange-400">₹{Math.floor(price / (plan.duration || plan.duration_months || 1))}/M</p>
        </div>
      </div>
    </div>
  );
}

export default TrainerPricing;
