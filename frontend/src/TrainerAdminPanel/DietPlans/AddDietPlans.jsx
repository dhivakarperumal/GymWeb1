import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { useAuth } from "../../PrivateRouter/AuthContext";

import { CheckSquare, RefreshCw, Search, Square, Users, X } from "lucide-react";
import api from "../../api";

const inputClass =
  "w-full bg-black/40 border border-white/20 rounded-lg px-3 py-3.5 text-white text-sm";

const meals = ["Early-morning", "Breakfast", "Mid-morning", "Lunch", "Evening", "Dinner", "Pre-workout", "Post-workout"];

/* ---------- GENERATE SINGLE DAY ---------- */
const generateSingleDay = () => {
  const day = {};
  meals.forEach((meal) => {
    day[meal] = {
      time: "",
      items: [{ food: "", quantity: "", calories: "" }]
    };
  });
  return day;
};

const AddDietPlans = () => {
  const { user } = useAuth();

  const trainerId = Number(user?.id || 0);
  const trainerName = user?.username || "";

  const { id } = useParams();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_, setAllAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);

  const [form, setForm] = useState({
    memberId: "",
    userId: "",
    memberName: "",
    memberEmail: "",
    memberMobile: "",
    memberWeight: "",
    title: "",
    totalCalories: "",
    duration: 1,
    days: [generateSingleDay()],
    notes: "",
  });

  /* ================= FETCH MEMBERS ================= */
  useEffect(() => {
    if (!user) return;

    const fetchMembers = async () => {
      try {
        setLoading(true);

        // Server-side filter -- avoids users.id vs staff.id mismatch
        const res = await api.get(`/assignments?trainerUserId=${user.id}`);
        const data = res.data;

        const assignments = Array.isArray(data)
          ? data
          : data.data || data.assignments || [];

        const formatted = assignments.map((d) => ({
          id: String(d.userId || d.user_id),
          userId: String(d.userId || d.user_id),
          gymMemberId: String(d.gymMemberId || d.member_db_id || ""),
          name: d.username || d.user_name || "Member",
          email: d.userEmail || d.user_email || "",
          mobile: d.userMobile || d.user_mobile || "",
          weight: d.userWeight || d.member_weight || "",
          planName: d.planName || d.plan_name || "Plan",
        }));

        setMembers(formatted);
        setAllAssignments(assignments);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [user]);

  /* ================= AUTO CALCULATE CALORIES ================= */
  const totalCalories = useMemo(() => {
    let total = 0;

    (form.days || []).forEach((day) => {
      Object.values(day || {}).forEach((meal) => {
        if (meal && Array.isArray(meal.items)) {
          meal.items.forEach(item => {
            total += Number(item.calories || 0);
          });
        }
      });
    });

    return total;
  }, [form.days]);

  /* ================= TIME FORMAT HELPERS ================= */
  const convertTo24Hour = (timeStr) => {
    if (!timeStr) return "";
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return timeStr; // Already 24h or invalid

    let hours = parseInt(match[1]);
    const minutes = match[2];
    const ampm = match[3].toUpperCase();

    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  };

  const formatTo12Hour = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    let h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${minutes} ${ampm}`;
  };

  /* ================= LOAD DIET FOR EDIT ================= */
  useEffect(() => {
    if (!id) return;

    const fetchDiet = async () => {
      try {
        const res = await api.get(`/diet-plans/${id}`);
        const data = res.data;

        const memberId = data.memberId || data.member_id;
        const memberName = data.memberName || data.member_name;

        let daysData = data.days;
        if (typeof daysData === 'string') {
          try { daysData = JSON.parse(daysData); } catch { daysData = []; }
        }

        let fixedDays = [];

        // Handle both object {Day1: ...} and array [...]
        if (Array.isArray(daysData)) {
          fixedDays = daysData.map(day => {
            const normalizedDay = {};
            meals.forEach(meal => {
              const mealData = day[meal];
              if (!mealData) {
                normalizedDay[meal] = { time: "", items: [{ food: "", quantity: "", calories: "" }] };
              } else {
                normalizedDay[meal] = {
                  time: mealData.time || "",
                  items: Array.isArray(mealData.items) ? mealData.items : [{ food: "", quantity: "", calories: "" }]
                };
              }
            });
            return normalizedDay;
          });
        } else {
          // Object format conversion
          const keys = Object.keys(daysData || {}).sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
          });

          fixedDays = keys.map(key => {
            const day = daysData[key];
            const normalizedDay = {};
            meals.forEach(meal => {
              const mealData = day[meal];
              if (!mealData) {
                normalizedDay[meal] = { time: "", items: [{ food: "", quantity: "", calories: "" }] };
              } else {
                normalizedDay[meal] = {
                  time: mealData.time || "",
                  items: Array.isArray(mealData.items) ? mealData.items : [{ food: "", quantity: "", calories: "" }]
                };
              }
            });
            return normalizedDay;
          });
        }

        // If empty, ensure at least 1 day
        if (fixedDays.length === 0) fixedDays = [generateSingleDay()];

        setForm({
          memberId,
          userId: data.user_id || data.userId || "",
          memberName,
          memberEmail: data.memberEmail || data.member_email || "",
          memberMobile: data.memberMobile || data.member_mobile || "",
          memberWeight: data.memberWeight || data.member_weight || "",
          title: data.title || "",
          totalCalories: data.totalCalories || data.total_calories || "",
          duration: data.duration || fixedDays.length,
          days: fixedDays,
          notes: data.notes || data.note || "",
        });
      } catch (err) {
        console.error(err);
        toast.error("Failed to load diet");
      }
    };

    fetchDiet();
  }, [id]);

  /* ================= HANDLE MEAL CHANGE ================= */
  const handleMealTimeChange = (dayIndex, meal, value) => {
    const formattedTime = formatTo12Hour(value);
    setForm((prev) => {
      const updatedDays = [...prev.days];
      updatedDays[dayIndex] = {
        ...updatedDays[dayIndex],
        [meal]: {
          ...updatedDays[dayIndex][meal],
          time: formattedTime,
        },
      };
      return { ...prev, days: updatedDays };
    });
  };

  const handleFoodItemChange = (dayIndex, meal, itemIndex, field, value) => {
    setForm((prev) => {
      const updatedDays = [...prev.days];
      const updatedItems = [...updatedDays[dayIndex][meal].items];
      updatedItems[itemIndex] = { ...updatedItems[itemIndex], [field]: value };

      updatedDays[dayIndex] = {
        ...updatedDays[dayIndex],
        [meal]: {
          ...updatedDays[dayIndex][meal],
          items: updatedItems,
        },
      };

      return { ...prev, days: updatedDays };
    });
  };

  const handleAddFoodItem = (dayIndex, meal) => {
    setForm((prev) => {
      const updatedDays = [...prev.days];
      updatedDays[dayIndex] = {
        ...updatedDays[dayIndex],
        [meal]: {
          ...updatedDays[dayIndex][meal],
          items: [...updatedDays[dayIndex][meal].items, { food: "", quantity: "", calories: "" }],
        },
      };
      return { ...prev, days: updatedDays };
    });
  };

  const handleRemoveFoodItem = (dayIndex, meal, itemIndex) => {
    setForm((prev) => {
      if (prev.days[dayIndex][meal].items.length <= 1) return prev;
      const updatedDays = [...prev.days];
      const updatedItems = updatedDays[dayIndex][meal].items.filter((_, i) => i !== itemIndex);

      updatedDays[dayIndex] = {
        ...updatedDays[dayIndex],
        [meal]: {
          ...updatedDays[dayIndex][meal],
          items: updatedItems,
        },
      };

      return { ...prev, days: updatedDays };
    });
  };

  /* ================= ADD DAY ================= */
  const handleAddDay = () => {
    const count = form.days.length;

    if (count >= 60) {
      toast.error("Maximum 60 days allowed");
      return;
    }

    setForm((prev) => ({
      ...prev,
      duration: count + 1,
      days: [...prev.days, generateSingleDay()],
    }));
  };

  /* ================= REMOVE DAY ================= */
  const handleRemoveDay = () => {
    const count = form.days.length;

    if (count <= 1) {
      toast.error("Minimum 1 day required");
      return;
    }

    setForm((prev) => ({
      ...prev,
      duration: count - 1,
      days: prev.days.slice(0, -1),
    }));
  };

  /* ================= COPY DAY 1 TO ALL ================= */
  const handleCopyDay1ToAll = () => {
    if (form.days.length <= 1) {
      toast.error("Add more days first");
      return;
    }

    const day1Data = form.days[0];
    const getDeepCopy = () => JSON.parse(JSON.stringify(day1Data));

    setForm((prev) => {
      const updatedDays = prev.days.map((day, i) => i === 0 ? day : getDeepCopy());
      return { ...prev, days: updatedDays };
    });
    toast.success("Day 1 copied to all days");
  };

  const normalizeString = (value) => {
    return String(value || "").trim();
  };

  const getRowValue = (row, keys) => {
    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        const value = row[key];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          return String(value).trim();
        }
      }
    }

    const lowerMap = Object.fromEntries(
      Object.keys(row).map((key) => [key.toLowerCase(), row[key]])
    );

    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(lowerMap, lowerKey)) {
        const value = lowerMap[lowerKey];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          return String(value).trim();
        }
      }
    }

    return "";
  };

  const parseDayNumber = (value) => {
    const raw = normalizeString(value);
    if (!raw) return null;

    const found = raw.match(/\d+/);
    if (found) {
      return Number(found[0]);
    }

    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const normalizeMeal = (value) => {
    const raw = normalizeString(value).toLowerCase();
    if (!raw) return "";

    const normalized = raw.replace(/[\s_-]+/g, " ").trim();

    if (["early morning", "early-morning", "early"].includes(normalized)) {
      return "Early-morning";
    }
    if (["mid morning", "mid-morning", "mid", "midmorning"].includes(normalized)) {
      return "Mid-morning";
    }
    if (["breakfast"].includes(normalized)) return "Breakfast";
    if (["lunch"].includes(normalized)) return "Lunch";
    if (["evening"].includes(normalized)) return "Evening";
    if (["dinner"].includes(normalized)) return "Dinner";
    if (["pre workout", "pre-workout", "preworkout"].includes(normalized)) {
      return "Pre-workout";
    }
    if (["post workout", "post-workout", "postworkout"].includes(normalized)) {
      return "Post-workout";
    }

    const found = meals.find((meal) => meal.toLowerCase() === raw);
    if (found) return found;

    for (const meal of meals) {
      if (raw.startsWith(meal.toLowerCase())) {
        return meal;
      }
    }

    if (raw.includes("pre") && raw.includes("workout")) return "Pre-workout";
    if (raw.includes("post") && raw.includes("workout")) return "Post-workout";
    if (raw.includes("early") && raw.includes("morning")) return "Early-morning";
    if (raw.includes("mid") && raw.includes("morning")) return "Mid-morning";
    if (raw.includes("breakfast")) return "Breakfast";
    if (raw.includes("lunch")) return "Lunch";
    if (raw.includes("dinner")) return "Dinner";
    if (raw.includes("evening")) return "Evening";
    if (raw.includes("morning")) return "Early-morning";

    return "";
  };

  const downloadDietPlanTemplate = () => {
    const template = [
      // Day 1
      { Day: "1", Meal: "Early-morning", Time: "06:00", Food: "Warm Water", Qty: "1 glass", Kcal: "0" },
      { Day: "1", Meal: "Early-morning", Time: "06:00", Food: "Almonds", Qty: "5 pcs", Kcal: "50" },

      { Day: "1", Meal: "Breakfast", Time: "08:00", Food: "Oats", Qty: "1 bowl", Kcal: "200" },
      { Day: "1", Meal: "Breakfast", Time: "08:00", Food: "Milk", Qty: "1 cup", Kcal: "100" },

      { Day: "1", Meal: "Mid-morning", Time: "11:00", Food: "Apple", Qty: "1", Kcal: "80" },

      { Day: "1", Meal: "Lunch", Time: "13:30", Food: "Rice", Qty: "1 plate", Kcal: "300" },
      { Day: "1", Meal: "Lunch", Time: "13:30", Food: "Chicken", Qty: "150g", Kcal: "250" },

      { Day: "1", Meal: "Evening", Time: "16:30", Food: "Nuts", Qty: "50g", Kcal: "200" },

      { Day: "1", Meal: "Pre-workout", Time: "17:30", Food: "Banana", Qty: "1", Kcal: "90" },

      { Day: "1", Meal: "Post-workout", Time: "19:00", Food: "Protein Shake", Qty: "1 scoop", Kcal: "120" },

      { Day: "1", Meal: "Dinner", Time: "21:00", Food: "Chapati", Qty: "2 pcs", Kcal: "200" },
      { Day: "1", Meal: "Dinner", Time: "21:00", Food: "Veg Curry", Qty: "1 bowl", Kcal: "150" },

      // Day 2
      { Day: "2", Meal: "Early-morning", Time: "06:00", Food: "Green Tea", Qty: "1 cup", Kcal: "5" },

      { Day: "2", Meal: "Breakfast", Time: "08:00", Food: "Eggs", Qty: "2 pcs", Kcal: "140" },
      { Day: "2", Meal: "Breakfast", Time: "08:00", Food: "Bread", Qty: "2 slices", Kcal: "160" },

      { Day: "2", Meal: "Mid-morning", Time: "11:00", Food: "Banana", Qty: "1", Kcal: "90" },

      { Day: "2", Meal: "Lunch", Time: "13:30", Food: "Rice", Qty: "1 plate", Kcal: "300" },
      { Day: "2", Meal: "Lunch", Time: "13:30", Food: "Fish", Qty: "150g", Kcal: "250" },

      { Day: "2", Meal: "Evening", Time: "16:30", Food: "Peanuts", Qty: "50g", Kcal: "250" },

      { Day: "2", Meal: "Pre-workout", Time: "17:30", Food: "Dates", Qty: "3 pcs", Kcal: "70" },

      { Day: "2", Meal: "Post-workout", Time: "19:00", Food: "Protein Shake", Qty: "1 scoop", Kcal: "120" },

      { Day: "2", Meal: "Dinner", Time: "21:00", Food: "Salad", Qty: "1 bowl", Kcal: "150" },
      { Day: "2", Meal: "Dinner", Time: "21:00", Food: "Soup", Qty: "1 cup", Kcal: "100" },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Diet Plan Sample");

    XLSX.writeFile(workbook, "Diet_Plan_Sample.xlsx");
  };

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      if (!rows || rows.length === 0) {
        toast.error("Excel file is empty or invalid.");
        return;
      }

      const parsedDays = {};
      let rowsParsed = 0;

      rows.forEach((row) => {
        const dayRaw = getRowValue(row, ["Day", "Day Number", "Day No", "DayNo", "Day#", "day"]);
        const mealRaw = getRowValue(row, ["Meal", "Meal Name", "Meal Type", "MealType", "meal"]);
        const dayNumber = parseDayNumber(dayRaw) || 1;
        const mealName = normalizeMeal(mealRaw);
        const time = getRowValue(row, ["Time", "Timing", "Meal Time", "MealTime", "time"]);
        const food = getRowValue(row, ["Food", "Food Item", "FoodItem", "Item", "Description", "food"]);
        const quantity = getRowValue(row, ["Qty", "Quantity", "QTY", "Serving", "quantity"]);
        const calories = getRowValue(row, ["Kcal", "Calories", "Cal", "Energy", "calories"]);

        if (!mealName) {
          return;
        }

        const dayKey = `Day${dayNumber}`;
        if (!parsedDays[dayKey]) {
          parsedDays[dayKey] = {};
        }

        if (!parsedDays[dayKey][mealName]) {
          parsedDays[dayKey][mealName] = {
            time: "",
            items: [],
          };
        }

        const mealData = parsedDays[dayKey][mealName];
        if (time) {
          mealData.time = time;
        }

        const rowItem = { food, quantity, calories };
        if (food || quantity || calories) {
          mealData.items.push(rowItem);
        }

        rowsParsed += 1;
      });

      const dayIndices = Object.keys(parsedDays)
        .map(key => parseInt(key.replace("Day", "")))
        .sort((a, b) => a - b);

      if (dayIndices.length === 0 || rowsParsed === 0) {
        toast.error("No valid diet rows found. Use columns like Day, Meal, Time, Food, Qty, Kcal.");
        return;
      }

      const maxDay = Math.max(...dayIndices);
      const newDaysArray = [];

      for (let i = 1; i <= maxDay; i++) {
        const rawDay = parsedDays[`Day${i}`] || {};
        const dayTemplate = generateSingleDay();
        const mergedDay = {};

        meals.forEach((meal) => {
          const mealData = rawDay[meal];
          if (mealData) {
            mergedDay[meal] = {
              ...dayTemplate[meal],
              time: mealData.time || dayTemplate[meal].time,
              items: mealData.items.length > 0 ? mealData.items : dayTemplate[meal].items,
            };
          } else {
            mergedDay[meal] = dayTemplate[meal];
          }
        });
        newDaysArray.push(mergedDay);
      }

      setForm((prev) => ({
        ...prev,
        days: newDaysArray,
        duration: newDaysArray.length,
      }));

      toast.success(`Imported diet plan for ${newDaysArray.length} day(s)`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to import Excel. Please check the file format.");
    } finally {
      setImporting(false);
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!id && selected.size === 0) {
      toast.error("Please select at least one member");
      return;
    }
    if (id && !form.memberId) {
      toast.error("Member ID is missing");
      return;
    }
    if (!form.title) {
      toast.error("Please fill required fields (Diet Title)");
      return;
    }

    const hasFood = Object.values(form.days).some((day) =>
      Object.values(day).some((meal) => meal.items?.some(item => item.food.trim() !== ""))
    );

    if (!hasFood) {
      toast.error("Add at least one food item");
      return;
    }

    setSubmitting(true);
    try {
      if (id) {
        const payload = {
          trainerId,
          trainerName,
          trainerSource: user?.role || "trainer",
          memberId: form.memberId,
          userId: form.userId || form.memberId,
          memberName: form.memberName,
          memberEmail: form.memberEmail,
          memberMobile: form.memberMobile,
          memberWeight: form.memberWeight,
          title: form.title,
          totalCalories: Number(form.totalCalories) || 0,
          duration: Number(form.duration) || form.days.length,
          days: form.days,
          notes: form.notes || "",
          status: "active",
        };
        await api.put(`/diet-plans/${id}`, payload);
        toast.success("Diet Plan Updated 🥗");
        setTimeout(() => navigate("/trainer/alladddietplans"), 1200);
      } else {
          // Bulk Create
          const selectedMembers = members.filter((m) => selected.has(m.id));
          let successCount = 0;
          let failCount = 0;

          for (const m of selectedMembers) {
            try {
              const payload = {
                trainerId,
                trainerName,
                trainerSource: user?.role || "trainer",
                memberId: m.gymMemberId || m.userId || m.id,
                userId: m.userId || m.id,
                memberName: m.name,
                memberEmail: m.email,
                memberMobile: m.mobile,
                memberWeight: m.weight,
                title: form.title,
                totalCalories: Number(totalCalories) || 0,
                duration: Number(form.duration) || form.days.length,
                days: form.days,
                notes: form.notes || "",
                status: "active",
              };
              await api.post(`/diet-plans`, payload);
              successCount++;
          } catch (err) {
            console.error(`Failed for member ${m.name}:`, err);
            failCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Created diet plan for ${successCount} member(s) 🥗💪`);
        }
        if (failCount > 0) {
          toast.error(`Failed for ${failCount} member(s)`);
        }

        if (successCount > 0) {
          setTimeout(() => navigate("/trainer/alladddietplans"), 1200);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error saving diet");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= SELECTION HELPERS ================= */
  const filteredMembers = members.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.name?.toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q) ||
      (m.mobile || "").includes(q)
    );
  });

  const toggleOne = (mId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(mId)) {
        next.delete(mId);
        if (next.size === 0) {
          setForm(p => ({ ...p, memberWeight: "" }));
        }
      } else {
        next.add(mId);
        // Find member in state
        const member = members.find(m => String(m.id) === String(mId));
        if (member && member.weight) {
          setForm(p => ({ ...p, memberWeight: member.weight }));
        }
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filteredMembers.length && filteredMembers.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredMembers.map((m) => m.id)));
    }
  };

  const allSelected = filteredMembers.length > 0 && selected.size === filteredMembers.length;

  if (loading || !trainerId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {id ? "Edit Diet Plan" : "Create Custom Diet Plan"}
          </h2>

          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadDietPlanTemplate}
                className="px-4 py-2 rounded-lg bg-slate-700/80 border border-white/10 text-white text-sm hover:bg-slate-700 transition"
              >
                Download Example Excel
              </button>

              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 cursor-pointer hover:bg-emerald-500/30 transition text-sm font-semibold">
                {importing ? "Importing..." : "Import Excel"}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
            </div>

            <label className="text-[10px] text-white/50 max-w-md text-right">
              Excel must include columns: Day, Meal, Time, Food, Qty, Kcal. Use meal names:
              Early-morning, Breakfast, Mid-morning, Lunch, Evening, Dinner, Pre-workout, Post-workout.
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* MEMBER SELECTION */}
          {!id ? (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Users size={18} className="text-emerald-400" />
                  Select Members ({selected.size} / {members.length})
                </label>
                <div
                  onClick={selectAll}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition border border-white/5"
                >
                  {allSelected ? (
                    <CheckSquare size={16} className="text-emerald-400" />
                  ) : (
                    <Square size={16} className="text-white/20" />
                  )}
                  <span className="text-xs font-medium text-white/70">
                    {allSelected ? "Deselect All" : "Select All"}
                  </span>
                </div>
              </div>

              {/* Member Search */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/60 text-white text-sm border border-white/10 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Member List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                  <div className="col-span-full py-4 text-center text-white/40 text-sm flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-emerald-400" />
                    Loading members...
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="col-span-full py-4 text-center text-white/40 text-sm">
                    No members found
                  </div>
                ) : (
                  filteredMembers.map((m) => {
                    const isSelected = selected.has(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleOne(m.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition border ${isSelected ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/5 hover:bg-white/10"
                          }`}
                      >
                        {isSelected ? (
                          <CheckSquare size={18} className="text-emerald-400 shrink-0" />
                        ) : (
                          <Square size={18} className="text-white/20 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate flex items-center gap-2">
                            {m.name}
                            {m.weight && <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">({m.weight}kg)</span>}
                          </p>
                          <p className="text-[10px] text-white/40 truncate">
                            {[m.email, m.planName].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="bg-black/40 border border-white/10 rounded-xl p-4">
              <label className="block text-sm font-semibold mb-2">Member</label>
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg opacity-80">
                <Users size={18} className="text-white/40" />
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    {form.memberName || "Selected Member"}
                    {form.memberWeight && <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">({form.memberWeight}kg)</span>}
                  </p>
                  <p className="text-xs text-white/40">{form.memberEmail || "No Email"}</p>
                </div>
              </div>
              <p className="text-yellow-400 text-[10px] mt-2 italic">
                (Member cannot be changed in edit mode)
              </p>
            </div>
          )}

          {/* TOP FIELDS: TITLE, CALORIES, DAYS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <label className="text-xs font-medium text-white/50 ml-1">Diet Plan Title</label>
              <select
                className={`${inputClass} [&>option]:text-black`}
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              >
                <option value="" disabled>Select Diet Plan Title...</option>
                <option value="Weight Loss Strategy">Weight Loss Strategy</option>
                <option value="High Protein Bulk">High Protein Bulk</option>
                <option value="Keto Diet Plan">Keto Diet Plan</option>
                <option value="Lean Muscle Building">Lean Muscle Building</option>
                <option value="General Fitness">General Fitness</option>
                <option value="Endurance & Stamina">Endurance & Stamina</option>
                <option value="Vegan Plan">Vegan Plan</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Total Calories (Auto)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="Total Calories"
                value={totalCalories}
                readOnly
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Member Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                className={inputClass}
                placeholder="Weight"
                value={form.memberWeight}
                onChange={(e) => setForm(p => ({ ...p, memberWeight: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Duration (Days)</label>
              <div className={`${inputClass} flex items-center justify-between bg-black/60`}>
                <span>{form.days.length} Days</span>
                <div className="flex gap-2">
                  <button type="button" onClick={handleRemoveDay} className="text-red-400 hover:text-red-300 font-bold px-1">-</button>
                  <button type="button" onClick={handleAddDay} className="text-emerald-400 hover:text-emerald-300 font-bold px-1">+</button>
                </div>
              </div>
            </div>


          </div>

          {/* DAYS */}
          <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">

            {form.days.map((dayData, dayIndex) => (
              <div
                key={dayIndex}
                className="bg-black/30 border border-white/10 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-emerald-400">Day {dayIndex + 1}</h3>
                  {dayIndex === 0 && form.days.length > 1 && (
                    <button
                      type="button"
                      onClick={handleCopyDay1ToAll}
                      className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition flex items-center gap-1"
                    >
                      Copy to All Days
                    </button>
                  )}
                </div>

                {meals.map((meal) => {
                  const isWorkoutMeal = meal.toLowerCase().includes("workout");
                  const mealColorClass = isWorkoutMeal
                    ? "bg-purple-500/20 border-purple-500/30 text-purple-400"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";

                  const mealItems = dayData[meal]?.items || [];

                  return (
                    <div key={meal} className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2">
                      {mealItems.map((item, idx) => (
                        <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-3">
                          {/* Meal Category (Left) */}
                          <div className="w-full md:w-32 shrink-0">
                            {idx === 0 ? (
                              <div className={`px-2 py-3 rounded-lg text-[10px] font-black uppercase tracking-tighter text-center border shadow-sm ${mealColorClass}`}>
                                {meal}
                              </div>
                            ) : (
                              <div className="hidden md:block h-10" />
                            )}
                          </div>

                          {/* Timing */}
                          <div className="w-full md:w-28 shrink-0">
                            {idx === 0 ? (
                              <div className="relative">
                                <input
                                  type="time"
                                  className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-white text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                                  value={convertTo24Hour(dayData[meal]?.time || "")}
                                  onChange={(e) => handleMealTimeChange(dayIndex, meal, e.target.value)}
                                />
                              </div>
                            ) : (
                              <div className="hidden md:block h-10" />
                            )}
                          </div>

                          {/* Food Item (Flexible) */}
                          <div className="flex-1 min-w-[200px]">
                            <input
                              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                              placeholder="Food Item"
                              value={item.food}
                              onChange={(e) => handleFoodItemChange(dayIndex, meal, idx, "food", e.target.value)}
                            />
                          </div>

                          {/* Quantity (Fixed) */}
                          <div className="w-24 shrink-0">
                            <input
                              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => handleFoodItemChange(dayIndex, meal, idx, "quantity", e.target.value)}
                            />
                          </div>

                          {/* Calories (Fixed) */}
                          <div className="w-24 shrink-0">
                            <input
                              type="number"
                              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                              placeholder="Kcal"
                              value={item.calories}
                              onChange={(e) => handleFoodItemChange(dayIndex, meal, idx, "calories", e.target.value)}
                            />
                          </div>


                          

                          {/* Actions */}
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAddFoodItem(dayIndex, meal)}
                              className="w-10 h-10 flex items-center justify-center bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/40 transition"
                            >
                              +
                            </button>
                            {mealItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFoodItem(dayIndex, meal, idx)}
                                className="w-10 h-10 flex items-center justify-center bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/40 transition"
                              >
                                -
                              </button>
                            )}
                          </div>
                          
                        </div>
                      ))}
                      
                    </div>
                    
                  );
                })}
                 <div className="space-y-1">
              <label className="text-xs font-medium text-white/50 ml-1">Notes</label>
              <textarea
                className={`${inputClass} min-h-[120px] resize-none`}
                placeholder="Overall notes for this diet plan"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
              </div>
            ))}

          </div>

          <div className="space-y-4">
           

            {/* SUBMIT */}
            <div className="flex justify-end">

              <button
                type="submit"
                disabled={submitting}
                className={`px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center gap-2 hover:scale-105 transition ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {submitting && <RefreshCw size={18} className="animate-spin" />}
                {submitting ? "Processing..." : (id ? "Update Diet Plan" : "Save Diet Plan")}
              </button>

            </div>
          </div>

        </form>

      </div>
    </div>
  );
}

export default AddDietPlans;