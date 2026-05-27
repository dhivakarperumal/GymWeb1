import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import cache from "../cache";

const format12h = (time) => {
  if (!time) return "";
  if (typeof time !== "string") return time;
  if (time.toLowerCase().includes("am") || time.toLowerCase().includes("pm")) return time;
  if (!time.includes(":")) return time;

  const [hours, minutes] = time.split(":");
  let h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
};

const DietChart = () => {
  const { user } = useAuth();

  const [diet, setDiet] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(null);

  const fetchDietPlan = async () => {
    if (cache.diets) {
      setDiet(cache.diets);
      setTitle(cache.dietTitle || "");
      setActiveDay(Object.keys(cache.diets)[0]);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      // Use the user's unique identifier (UUID preferred, then integer ID)
      const identifier = user.user_id || user.id;
      const res = await api.get(`/diet-plans?memberId=${identifier}`);
      const userPlans = Array.isArray(res.data) ? res.data : [];

      if (userPlans.length === 0) {
        setDiet(null);
        return;
      }

      const latestPlan = userPlans.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0];

      setTitle(latestPlan.title);
      cache.dietTitle = latestPlan.title;

      let daysData = latestPlan.days;
      if (typeof daysData === "string") {
        daysData = JSON.parse(daysData);
      }

      setDiet(daysData);
      cache.diets = daysData;

      // set first day as default
      const firstDay = Object.keys(daysData)[0];
      setActiveDay(firstDay);

    } catch (err) {
      console.error("Diet fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDietPlan();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Calculating Nutrition</p>
      </div>
    );
  }

  if (!diet) {
    return (
      <div className="text-center py-20">
        <h3 className="text-white text-lg font-semibold">
          No Diet Plan Assigned
        </h3>
      </div>
    );
  }

  const days = Object.keys(diet);
  const meals = diet[activeDay];

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold text-red-500">
        {title || "My Diet Plan"}
      </h2>

      {/* DAY TABS */}
      {/* <div className="flex gap-3 flex-wrap">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer
              ${activeDay === day
                ? "bg-red-500 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
          >
            {(() => {
              const s = day.toString();
              if (/^\d+$/.test(s)) return `Day ${parseInt(s) + 1}`;
              return s.replace(/^Day(\d+)$/, (_, n) => `Day ${n}`);
            })()}
          </button>
        ))}
      </div> */}

      {/* MEALS */}
      <div className="grid md:grid-cols-2 gap-4">

        {Object.entries(meals).map(([meal, value]) => {
          const mealItems = value.items || [];
          const totalCalories = mealItems.reduce((sum, item) => {
            return sum + (parseInt(item.calories) || 0);
          }, 0);

          return (
            <div
              key={meal}
              className="bg-gray-900/50 backdrop-blur-md rounded-xl overflow-hidden border border-red-500/20 hover:border-red-500/40 transition-all group"
            >
              {/* MEAL HEADER */}
              <div className="flex justify-between items-center bg-black/40 px-5 py-3 border-b border-red-500/20">
                <h3 className="text-red-500 text-xs font-bold uppercase tracking-wider">
                  {meal}
                </h3>
                {value.time && (
                  <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full font-medium">
                    {format12h(value.time)}
                  </span>
                )}
              </div>

              {/* MEAL ITEMS */}
              <div className="px-5 py-4 space-y-3">
                {mealItems.length > 0 ? (
                  <>
                    {mealItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-2 pb-2 border-b border-white/5 last:border-0 last:pb-0">
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium group-hover:text-red-400 transition-colors">
                            {item.food}
                          </p>
                          <p className="text-white/40 text-[11px] mt-1">
                            Qty: <span className="text-white/60">{item.quantity}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap">
                            {item.calories} <span className="text-[10px] opacity-70">kcal</span>
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* TOTAL CALORIES */}
                    {mealItems.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-red-500/20 flex items-center justify-between">
                        <span className="text-[10px] text-white/30 uppercase tracking-tighter font-semibold">Total</span>
                        <span className="text-xs font-bold text-red-500">
                          {totalCalories} <span className="text-[10px] opacity-70">kcal</span>
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-white text-sm">No food item</p>
                )}
              </div>
            </div>
          );
        })}

      </div>

      {/* DAY NOTES SECTION */}
      {Object.values(meals).some(m => m.notes) && (
        <div className="mt-6 bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Trainer Notes for this Day
          </h3>
          <div className="space-y-2">
            {Object.entries(meals).map(([meal, value]) => 
              value.notes ? (
                <div key={`${activeDay}-${meal}-note`} className="text-white/70 text-sm leading-relaxed">
                  <span className="text-orange-400 font-semibold text-xs uppercase">{meal}:</span>{" "}
                  <span>{value.notes}</span>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* GET DAY NOTES FROM DIET OBJECT */}
      {diet[activeDay]?.notes && (
        <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 backdrop-blur-sm">
          <h3 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            Important Note
          </h3>
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {diet[activeDay].notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default DietChart;