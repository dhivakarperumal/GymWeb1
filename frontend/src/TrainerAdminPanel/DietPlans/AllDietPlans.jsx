
import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Eye, Trash2, Edit2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";

import api from "../../api";


const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timeSlots = [
  { label: "Early-morning", key: "Early-morning" },
  { label: "Breakfast", key: "Breakfast" },
  { label: "Mid-morning", key: "Mid-morning" },
  { label: "Lunch", key: "Lunch" },
  { label: "Evening", key: "Evening" },
  { label: "Dinner", key: "Dinner" },
  { label: "Pre-workout", key: "Pre-workout" },
  { label: "Post-workout", key: "Post-workout" },
];

const AllDietPlans = () => {
  const { user } = useAuth();
  const trainerId = user?.id;

  const [dietPlans, setDietPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeWeek, setActiveWeek] = useState(1);
  const navigate=useNavigate();
  const [search, setSearch] = useState("");
  const [calorieFilter, setCalorieFilter] = useState("");

  const filteredDietPlans = useMemo(() => {
    return dietPlans.filter((d) => {
      const matchesSearch = `${d.memberName || ''} ${d.title || ''}`.toLowerCase().includes(search.toLowerCase());

      let matchesCalorie = true;
      const c = Number(d.calories || 0);
      if (calorieFilter === 'low') matchesCalorie = c > 0 && c < 1500;
      if (calorieFilter === 'medium') matchesCalorie = c >= 1500 && c <= 2500;
      if (calorieFilter === 'high') matchesCalorie = c > 2500;

      return matchesSearch && matchesCalorie;
    });
  }, [dietPlans, search, calorieFilter]);

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!trainerId) return;

    const fetchPlans = async () => {
      try {
        const res = await api.get(`/diet-plans?trainerId=${trainerId}`);
        const data = res.data;
        // normalize snake_case to camelCase for frontend convenience
        const normalized = data.map((p) => ({
          ...p,
          memberName: p.member_name || p.memberName || "",
          calories: p.total_calories || p.totalCalories || 0,
          duration: p.duration,
          title: p.title || "",
        }));
        setDietPlans(normalized);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load diet plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [trainerId]);

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this diet plan?")) return;
    try {
      await api.delete(`/diet-plans/${id}`);
      toast.success("Diet plan deleted");
      setDietPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };



  return (
    <div className="min-h-screen  p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-2xl font-bold">All Diet Plans</h2>

          <div className="flex flex-col gap-3 
                sm:flex-row sm:items-center sm:justify-between">

  {/* Search Input */}
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search by member or title..."
    className="w-full sm:w-64 px-4 py-2 rounded-lg 
               bg-white/10 border border-white/20 
               focus:outline-none focus:ring-2 
               focus:ring-cyan-500"
  />

  {/* Calorie Filter */}
  <select
    value={calorieFilter}
    onChange={(e) => setCalorieFilter(e.target.value)}
    className="w-full sm:w-48 px-4 py-2 rounded-lg 
               bg-white/10 border border-white/20 
               focus:outline-none focus:ring-2 
               focus:ring-cyan-500"
  >
    <option value="">All Calories</option>
    <option value="low">&lt; 1500</option>
    <option value="medium">1500 - 2500</option>
    <option value="high">&gt; 2500</option>
  </select>

  {/* Add Button */}
  <button
    onClick={() => navigate('/trainer/adddietplans')}
    className="w-full sm:w-auto px-4 py-2 
               bg-orange-500 hover:bg-orange-600  
               rounded-lg flex items-center 
               justify-center gap-2 transition"
  >
    <Plus size={16} />
    Add New
  </button>

</div>

        </div>

        {/* TABLE (desktop) */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[640px] w-full text-sm text-left">
            <thead className="bg-white/10 text-gray-300">
              <tr>
                <th className="px-4 py-3">S No</th>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Calories</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDietPlans.map((d,i) => (
                <tr key={d.id} className="border-b border-white/10">
                  <td className="px-4 py-3">{i+1}</td>
                  <td className="px-4 py-3">{d.memberName}</td>
                  <td className="px-4 py-3">{d.title}</td>
                  <td className="px-4 py-3">{d.calories}</td>
                  <td className="px-4 py-3">{d.duration} days</td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedPlan(d);
                        setActiveWeek(1);
                      }}
                      className="p-2 rounded-full bg-yellow-500 text-white border border-yellow-500/30 hover:bg-yellow-500/30 transition"
                    >
                      <Eye  size={18} />
                    </button>

                    <button
                        onClick={() => navigate(`/trainer/adddietplans/${d.id}`)}
                        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-500"
                      >
                        <Edit2 size={18} />
                      </button>

                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-2 rounded-full bg-red-500 text-white border border-red-500/30 hover:bg-red-500/30 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* CARDS (mobile) */}
          <div className="sm:hidden space-y-4">
            {filteredDietPlans.length === 0 ? (
              <div className="text-center py-6 text-gray-400">No diet plans added yet</div>
            ) : (
              filteredDietPlans.map((d, i) => (
                <div key={d.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold">{d.memberName || 'Member'}</p>
                      <p className="text-xs text-gray-400">{d.title} • {d.calories} kcal</p>
                      <p className="text-xs text-gray-400 mt-2">Duration: {d.duration} days</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2 border-l border-white/10 pl-6">
                        <button onClick={() => { setSelectedPlan(d); setActiveWeek(1); }} className="p-2 rounded-full bg-yellow-500 text-white">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => navigate(`/trainer/adddietplans/${d.id}`)} className="p-2 rounded-full bg-green-500 text-white">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="p-2 rounded-full bg-red-500 text-white">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">#{i+1}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        {/* VIEW MODAL */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 w-full max-w-full sm:max-w-7xl h-[90vh] flex flex-col rounded-xl border border-white/10 shadow-2xl overflow-hidden">
              
              {/* FIXED HEADER */}
              <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {selectedPlan.title}
                  </h3>
                  <div className="flex gap-2 border-l border-white/10 pl-6">
                    {Array.from({ length: Math.ceil(selectedPlan.duration / 7) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveWeek(i + 1)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          activeWeek === i + 1
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        Week {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-500/20"
                >
                  <span className="text-xl">&times;</span>
                </button>
              </div>

              {/* SCROLLABLE BODY */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-black/20">
                <div className="border border-gray-700 rounded-xl overflow-x-auto custom-scrollbar">
                  <div className="min-w-[1200px]">
                    {/* TABLE HEADER */}
                    <div className="grid grid-cols-9 bg-black text-center font-semibold border-b border-gray-700 text-[10px] sticky top-0 z-10">
                      <div className="p-4 border-r border-gray-700 bg-black">DAY</div>
                      {timeSlots.map((t) => (
                        <div key={t.label} className="p-4 border-r border-gray-700 uppercase bg-black">
                          {t.label}
                        </div>
                      ))}
                    </div>

                    {weekDays.map((dayName, index) => {
                      const dayNumber = (activeWeek - 1) * 7 + index + 1;
                      const dayKey = `Day${dayNumber}`;
                      const dayData = selectedPlan.days?.[dayKey];

                      return (
                        <div
                          key={dayName}
                          className="grid grid-cols-9 border-b border-gray-800 text-center text-xs hover:bg-white/[0.02] transition"
                        >
                          <div className="p-4 border-r border-gray-800 font-semibold bg-white/5 flex items-center justify-center">
                            {dayName}
                          </div>

                          {timeSlots.map((t) => {
                            const mealData = dayData?.[t.key];
                            let items = [];
                            let time = "";

                            if (mealData) {
                              if (mealData.items) {
                                items = mealData.items;
                                time = mealData.time;
                              } else if (typeof mealData === "string") {
                                items = [{ food: mealData }];
                              } else {
                                items = [{ food: mealData.food, quantity: mealData.quantity }];
                                time = mealData.time;
                              }
                            }

                            return (
                              <div
                                key={t.label}
                                className="p-2 border-r border-gray-800 flex flex-col gap-1 overflow-y-auto max-h-32"
                              >
                                {time && <div className="text-[10px] text-emerald-400 font-bold">{time}</div>}
                                {items.map((it, i) => (
                                  <div key={i} className="text-[10px] leading-tight">
                                    <span className="font-medium text-white">{it.food}</span>
                                    {it.quantity && <span className="text-gray-400 block">({it.quantity})</span>}
                                  </div>
                                ))}
                                {items.length === 0 && <span className="text-gray-600">-</span>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="p-4 border-t border-white/10 bg-white/5 text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                  {selectedPlan.memberName} • {selectedPlan.calories} Total Kcal • {selectedPlan.duration} Days Plan
                </p>
              </div>

            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default AllDietPlans;
