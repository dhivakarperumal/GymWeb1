
import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Eye, Trash2, Edit2, Plus, LayoutGrid, List } from "lucide-react";
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
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'

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
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="relative w-full md:w-80">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search member or title..."
                className="w-full pl-4 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              />
            </div>
          
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 h-fit">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2.5 rounded-xl transition-all ${
                  viewMode === "table" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-gray-500 hover:text-white"
                }`}
                title="Table View"
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`p-2.5 rounded-xl transition-all ${
                  viewMode === "card" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-gray-500 hover:text-white"
                }`}
                title="Card View"
              >
                <LayoutGrid size={20} />
              </button>
            </div>

            <button
              onClick={() => navigate('/trainer/adddietplans')}
              className="flex items-center gap-2 px-6 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black uppercase text-xs transition-all shadow-lg shadow-orange-500/20"
            >
              <Plus size={16} />
              Add New
            </button>
          </div>
        </div>

        {/* CONTENT VIEW */}
        {viewMode === "table" ? (
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/10 text-white">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">S No</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Member</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Title</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Calories</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Duration</th>
                  <th className="px-4 py-4 text-sm font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDietPlans.map((d, i) => (
                  <tr key={d.id} className="border-b border-white/10 hover:bg-white/5 transition group">
                    <td className="px-4 py-4 text-base text-gray-400">{i + 1}</td>
                    <td className="px-4 py-4 text-base font-medium text-white">{d.memberName}</td>
                    <td className="px-4 py-4 text-base text-gray-300">{d.title}</td>
                    <td className="px-4 py-4 text-base">
                      <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                        {d.calories} KCAL
                      </span>
                    </td>
                    <td className="px-4 py-4 text-base text-gray-400">{d.duration} Days</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => { 
                            let rawDays = d.days;
                            let parsedDays = [];
                            try {
                              // Recursive parse to handle potential double-encoding
                              while (typeof rawDays === 'string') {
                                rawDays = JSON.parse(rawDays);
                              }
                              parsedDays = rawDays;
                            } catch (e) {
                              console.error("Parse error", e);
                              parsedDays = [];
                            }
                            setSelectedPlan({ ...d, days: parsedDays }); 
                            setActiveWeek(1); 
                          }}
                          className="p-2.5 rounded-xl bg-white/5 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/trainer/adddietplans/${d.id}`)}
                          className="p-2.5 rounded-xl bg-white/5 text-blue-400 hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="p-2.5 rounded-xl bg-white/5 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDietPlans.map((d, i) => (
              <div key={d.id} className="group relative bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-emerald-500/50 transition-all duration-500 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 p-8 bg-emerald-500/10 rounded-bl-[100px] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-all" />
                
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-emerald-500/20 p-4 rounded-2xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <Eye size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                      #{ i + 1 }
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">
                      {d.memberName}
                    </h4>
                    <p className="text-gray-400 text-sm font-medium mt-1">{d.title}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Calories</p>
                      <p className="text-emerald-400 font-black">{d.calories} kcal</p>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Duration</p>
                      <p className="text-white font-black">{d.duration} Days</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => { 
                        let rawDays = d.days;
                        let parsedDays = [];
                        try {
                          while (typeof rawDays === 'string') {
                            rawDays = JSON.parse(rawDays);
                          }
                          parsedDays = rawDays;
                        } catch (e) {
                          console.error("Parse error", e);
                          parsedDays = [];
                        }
                        setSelectedPlan({ ...d, days: parsedDays }); 
                        setActiveWeek(1); 
                      }}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                    >
                      View Plan
                    </button>
                    <button
                      onClick={() => navigate(`/trainer/adddietplans/${d.id}`)}
                      className="p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all border border-white/5"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="p-3 bg-white/5 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all border border-white/5"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MOBILE FALLBACK (if viewMode isn't enough) */}
        <div className="sm:hidden space-y-4">
          {filteredDietPlans.length === 0 && (
            <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/10 border-dashed">
              <p className="text-gray-500 text-sm font-medium">No diet plans found matching your criteria.</p>
            </div>
          )}
        </div>
        {/* VIEW MODAL - PREMIUM REDESIGN */}
        {selectedPlan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={() => setSelectedPlan(null)}>
            <div 
              className="bg-gray-950/90 border border-white/10 w-full max-w-7xl rounded-3xl p-5 md:p-7 overflow-hidden shadow-2xl backdrop-blur-2xl flex flex-col max-h-[95vh]"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* HEADER & NAV */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div>
                    <h3 className="text-2xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse" />
                      {selectedPlan.title}
                    </h3>
                    <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest font-black flex items-center gap-3">
                      <span>{selectedPlan.memberName}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-emerald-400">{selectedPlan.calories} KCAL</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{selectedPlan.duration} DAYS</span>
                    </p>
                  </div>

                  {/* WEEK SELECTOR */}
                  <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 h-fit">
                    {Array.from({ length: Math.ceil(selectedPlan.duration / 7) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveWeek(i + 1)}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${
                          activeWeek === i + 1
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                            : "text-gray-500 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        Week {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all duration-300 w-fit self-end md:self-auto"
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>

              {/* TABLE CONTAINER */}
              <div className="flex-1 overflow-auto rounded-2xl border border-white/5 custom-scrollbar">
                <div className="min-w-[1200px]">
                  {/* TABLE HEADER */}
                  <div className="grid grid-cols-9 bg-white/5 border-b border-white/10 text-center sticky top-0 z-20 backdrop-blur-xl">
                    <div className="p-5 border-r border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-950/50">
                      DAY / MEAL
                    </div>
                    {timeSlots.map((t) => (
                      <div key={t.label} className="p-5 border-r border-white/10 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                        {t.label}
                      </div>
                    ))}
                  </div>

                  {/* TABLE BODY */}
                  {weekDays.map((dayName, index) => {
                    const dayNumber = (activeWeek - 1) * 7 + index + 1;
                    
                    // Robust day data lookup
                    let dayData = null;
                    if (selectedPlan.days) {
                      if (Array.isArray(selectedPlan.days)) {
                        dayData = selectedPlan.days[dayNumber - 1];
                      } else {
                        // Object lookup: Try Day1, day1, 1, "1"
                        dayData = selectedPlan.days[`Day${dayNumber}`] || 
                                  selectedPlan.days[`day${dayNumber}`] || 
                                  selectedPlan.days[dayNumber] || 
                                  selectedPlan.days[String(dayNumber)];
                      }
                    }

                    return (
                      <div
                        key={dayName}
                        className="grid grid-cols-9 border-b border-white/5 text-center hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Day Column */}
                        <div className="p-6 border-r border-white/5 font-bold text-[10px] uppercase tracking-widest text-emerald-400/80 bg-white/[0.02] flex items-center justify-center sticky left-0 z-10 backdrop-blur-md">
                          {dayName}
                        </div>

                        {/* Meal Slots */}
                        {timeSlots.map((t) => {
                          // Robust data extraction
                          let mealData = null;
                          if (dayData) {
                            // 1. Direct key match
                            if (dayData[t.key]) {
                              mealData = dayData[t.key];
                            } else {
                              // 2. Case-insensitive & space/hyphen insensitive lookup
                              const normalizedSearchKey = t.key.toLowerCase().replace(/[\s_-]/g, "");
                              const foundEntry = Object.entries(dayData).find(([k]) => {
                                const normalizedKey = k.toLowerCase().replace(/[\s_-]/g, "");
                                return normalizedKey === normalizedSearchKey;
                              });
                              if (foundEntry) mealData = foundEntry[1];
                            }
                          }

                          let items = [];
                          let time = "";

                          if (mealData) {
                            // Handle various mealData formats (legacy string, new object with items array, or single item object)
                            if (mealData.items && Array.isArray(mealData.items)) {
                              // Filter out truly empty items (no food name)
                              items = mealData.items.filter(it => (it.food || it.Food || "").trim() !== "");
                              time = mealData.time || mealData.Time || "";
                            } else if (typeof mealData === "string" && mealData.trim() !== "") {
                              items = [{ food: mealData }];
                            } else if (mealData.food || mealData.Food) {
                              items = [{ 
                                food: mealData.food || mealData.Food, 
                                quantity: mealData.quantity || mealData.Quantity || mealData.qty || mealData.Qty || "" 
                              }];
                              time = mealData.time || mealData.Time || "";
                            }
                          }

                          return (
                            <div
                              key={t.label}
                              className="p-3 border-r border-white/5 flex items-start justify-center min-h-[140px]"
                            >
                              {items.length > 0 ? (
                                <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-4 w-full shadow-lg group hover:border-emerald-500/40 transition-all">
                                  {time && (
                                    <div className="text-[9px] font-black text-emerald-400 mb-2 uppercase flex items-center gap-1.5 opacity-70">
                                      <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                                      {time}
                                    </div>
                                  )}
                                  <ul className="text-[10px] text-left space-y-2">
                                    {items.map((it, i) => (
                                      <li key={i} className="flex flex-col border-b border-white/5 last:border-0 pb-1.5 last:pb-0">
                                        <span className="font-bold text-white leading-tight group-hover:text-emerald-400 transition-colors">
                                          {it.food || it.Food}
                                        </span>
                                        {(it.quantity || it.Quantity || it.qty || it.Qty) && (
                                          <span className="text-gray-500 text-[9px] font-medium mt-0.5 uppercase">
                                            {it.quantity || it.Quantity || it.qty || it.Qty}
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <div className="mt-6 w-6 h-0.5 bg-white/10 rounded-full opacity-30" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>


            </div>
          </div>
        )}



      </div>
    </div>
  );
};

export default AllDietPlans;
