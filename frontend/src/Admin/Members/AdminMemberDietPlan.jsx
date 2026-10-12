import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileUp, Plus, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import api from "../../api";

const meals = [
  "Early-morning",
  "Breakfast",
  "Mid-morning",
  "Lunch",
  "Evening",
  "Dinner",
  "Pre-workout",
  "Post-workout",
];

const inputClass =
  "w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500";

const createDay = () => ({
  ...Object.fromEntries(meals.map((meal) => [
    meal,
    { time: "", items: [{ food: "", quantity: "", calories: "" }] },
  ])),
  notes: "",
});

const normalizeTime = (value) => {
  const time = String(value || "").trim();
  const twelveHour = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    let hours = Number(twelveHour[1]) % 12;
    if (twelveHour[3].toUpperCase() === "PM") hours += 12;
    return `${String(hours).padStart(2, "0")}:${twelveHour[2]}`;
  }
  const twentyFourHour = time.match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  return twentyFourHour ? `${twentyFourHour[1].padStart(2, "0")}:${twentyFourHour[2]}` : "";
};

const createPlanForm = (plan) => {
  let rawDays = plan?.days;
  if (typeof rawDays === "string") {
    try {
      rawDays = JSON.parse(rawDays);
    } catch {
      rawDays = null;
    }
  }
  const dayList = Array.isArray(rawDays)
    ? rawDays
    : rawDays && typeof rawDays === "object"
      ? Object.keys(rawDays)
        .sort((a, b) => Number(a.replace(/\D/g, "")) - Number(b.replace(/\D/g, "")))
        .map((key) => rawDays[key])
      : [];
  const days = dayList.length
    ? dayList.map((rawDay) => {
      const day = createDay();
      meals.forEach((meal) => {
        const mealData = rawDay?.[meal];
        if (typeof mealData === "string") {
          day[meal] = {
            time: "",
            items: [{ food: mealData, quantity: "", calories: "" }],
          };
        } else if (Array.isArray(mealData)) {
          day[meal] = {
            time: "",
            items: mealData.map((item) => typeof item === "string"
              ? { food: item, quantity: "", calories: "" }
              : { food: item.food || item.name || "", quantity: item.quantity ?? item.qty ?? "", calories: item.calories ?? item.kcal ?? "" }),
          };
        } else if (mealData && typeof mealData === "object") {
          day[meal] = {
            time: normalizeTime(mealData.time),
            items: Array.isArray(mealData.items) && mealData.items.length
              ? mealData.items.map((item) => ({
                food: item.food || item.name || "",
                quantity: item.quantity ?? item.qty ?? "",
                calories: item.calories ?? item.kcal ?? "",
              }))
              : [{ food: "", quantity: "", calories: "" }],
          };
        }
      });
      day.notes = rawDay?.notes || rawDay?.note || "";
      return day;
    })
    : [createDay()];

  return {
    title: plan?.title || "",
    memberWeight: plan?.member_weight || plan?.memberWeight || "",
    days,
  };
};

const getPlanMemberId = (plan) => plan.member_id ?? plan.memberId;
const memberIdOf = (member) => member?.id ?? member?.member_id;
const memberNameOf = (member) => member?.name || member?.username || "Member";
const memberEmailOf = (member) => member?.email || member?.user_email || "";
const memberMobileOf = (member) => member?.phone || member?.mobile || member?.user_mobile || "";
const normalizeMobile = (value) => String(value || "").replace(/\D/g, "").replace(/^0+/, "");

const dietExportColumns = [
  "Diet Title",
  "Member ID",
  "Member Name",
  "Mobile",
  "Member Weight (kg)",
  "Duration (Days)",
  "Day",
  "Meal",
  "time",
  "Food",
  "Qty",
  "Kcal",
];

const matchesMember = (plan, member) => {
  const selectedId = String(memberIdOf(member));
  const savedMemberId = getPlanMemberId(plan);
  if (savedMemberId != null && String(savedMemberId) === selectedId) return true;
  const savedUserId = plan.user_id ?? plan.userId;
  const userIds = [member.user_id, member.u_id].filter((value) => value != null).map(String);
  if (savedUserId != null && userIds.includes(String(savedUserId))) return true;
  if (savedMemberId != null || savedUserId != null) return false;
  const email = memberEmailOf(member).trim().toLowerCase();
  if (email && String(plan.member_email || "").trim().toLowerCase() === email) return true;
  const mobile = normalizeMobile(memberMobileOf(member));
  return !!mobile && normalizeMobile(plan.member_mobile) === mobile;
};

const getCell = (row, names) => {
  const keys = Object.keys(row);
  const matchingKey = keys.find((key) =>
    names.some((name) => key.trim().toLowerCase() === name.trim().toLowerCase()),
  );
  return matchingKey ? String(row[matchingKey] ?? "").trim() : "";
};

const normalizeMeal = (value) => {
  const normalized = value.toLowerCase().replace(/[\s_-]+/g, " ").trim();
  const aliases = {
    "early morning": "Early-morning",
    early: "Early-morning",
    "mid morning": "Mid-morning",
    mid: "Mid-morning",
    breakfast: "Breakfast",
    lunch: "Lunch",
    evening: "Evening",
    dinner: "Dinner",
    "pre workout": "Pre-workout",
    preworkout: "Pre-workout",
    "post workout": "Post-workout",
    postworkout: "Post-workout",
  };
  if (aliases[normalized]) return aliases[normalized];
  return meals.find((meal) =>
    meal.toLowerCase().replace(/[\s_-]+/g, " ") === normalized,
  ) || "";
};

const AdminMemberDietPlan = ({ member, creator }) => {
  const selectedMemberId = memberIdOf(member);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => createPlanForm(null));

  const plan = plans[0] || null;
  const totalCalories = useMemo(
    () => form.days.reduce((total, day) =>
      total + meals.reduce((mealTotal, meal) =>
        mealTotal + day[meal].items.reduce(
          (itemTotal, item) => itemTotal + (Number(item.calories) || 0),
          0,
        ),
      0),
    0),
    [form.days],
  );

  const fetchPlans = useCallback(async () => {
    const response = await api.get(`/diet-plans?memberId=${encodeURIComponent(selectedMemberId)}`);
    if (!Array.isArray(response.data)) {
      throw new Error("The diet plan API returned an invalid response.");
    }
    return response.data
      .filter((item) => matchesMember(item, member))
      .sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0));
  }, [member, selectedMemberId]);

  const applyPlans = useCallback((nextPlans) => {
    setPlans(nextPlans);
    setLoadError("");
    if (nextPlans.length) setForm(createPlanForm(nextPlans[0]));
  }, []);

  const handleLoadError = useCallback((error) => {
    console.error("Failed to load member diet plan", error);
    setPlans([]);
    setLoadError(error.response?.data?.error || error.message || "Failed to load diet plan.");
  }, []);

  useEffect(() => {
    let active = true;
    fetchPlans()
      .then((nextPlans) => {
        if (active) applyPlans(nextPlans);
      })
      .catch((error) => {
        if (active) handleLoadError(error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyPlans, fetchPlans, handleLoadError]);

  const reloadPlans = async () => {
    setLoading(true);
    try {
      applyPlans(await fetchPlans());
    } catch (error) {
      handleLoadError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateMeal = (dayIndex, meal, changes) => {
    setForm((previous) => ({
      ...previous,
      days: previous.days.map((day, index) =>
        index === dayIndex ? { ...day, [meal]: { ...day[meal], ...changes } } : day,
      ),
    }));
  };

  const updateFoodItem = (dayIndex, meal, itemIndex, field, value) => {
    const items = form.days[dayIndex][meal].items.map((item, index) =>
      index === itemIndex ? { ...item, [field]: value } : item,
    );
    updateMeal(dayIndex, meal, { items });
  };

  const addFoodItem = (dayIndex, meal) => {
    updateMeal(dayIndex, meal, {
      items: [...form.days[dayIndex][meal].items, { food: "", quantity: "", calories: "" }],
    });
  };

  const removeFoodItem = (dayIndex, meal, itemIndex) => {
    const items = form.days[dayIndex][meal].items.filter((_, index) => index !== itemIndex);
    updateMeal(dayIndex, meal, {
      items: items.length ? items : [{ food: "", quantity: "", calories: "" }],
    });
  };

  const updateNotes = (dayIndex, value) => {
    setForm((previous) => ({
      ...previous,
      days: previous.days.map((day, index) =>
        index === dayIndex ? { ...day, notes: value } : day,
      ),
    }));
  };

  const beginAddingDay = () => {
    const currentForm = createPlanForm(plan);
    if (currentForm.days.length >= 60) {
      toast.error("Maximum 60 days allowed.");
      return;
    }
    setForm({
      ...currentForm,
      days: [...currentForm.days, createDay()],
    });
    setEditing(true);
  };

  const addDay = () => {
    if (form.days.length >= 60) {
      toast.error("Maximum 60 days allowed.");
      return;
    }
    setForm((previous) => ({ ...previous, days: [...previous.days, createDay()] }));
  };

  const removeDay = () => {
    if (form.days.length <= 1) {
      toast.error("Minimum 1 day required.");
      return;
    }
    setForm((previous) => ({ ...previous, days: previous.days.slice(0, -1) }));
  };

  const savePlan = async () => {
    if (!form.title) {
      toast.error("Please select a diet plan title.");
      return;
    }
    if (!form.days.some((day) =>
      meals.some((meal) => day[meal].items.some((item) => item.food.trim())),
    )) {
      toast.error("Add at least one food item.");
      return;
    }
    const planTrainerId = plan?.trainer_id ?? creator?.id;
    if (!selectedMemberId || !planTrainerId) {
      toast.error("Member ID or account ID is unavailable.");
      return;
    }

    const memberUserId = member.u_id || member.user_id || selectedMemberId;
    const payload = {
      trainerId: planTrainerId,
      trainerName: plan?.trainer_name ?? creator?.username ?? creator?.name ?? "",
      trainerSource: plan?.trainer_source ?? creator?.role ?? "admin",
      memberId: selectedMemberId,
      userId: plan?.user_id || memberUserId,
      memberName: memberNameOf(member),
      memberEmail: memberEmailOf(member),
      memberMobile: memberMobileOf(member),
      memberWeight: form.memberWeight || member.weight || "",
      title: form.title,
      totalCalories,
      duration: form.days.length,
      days: form.days,
      status: plan?.status || "active",
    };

    setSaving(true);
    try {
      const response = plan?.id
        ? await api.put(`/diet-plans/${plan.id}`, payload)
        : await api.post("/diet-plans", payload);
      if (!response.data?.id) {
        throw new Error("The diet plan API did not confirm the saved plan.");
      }
      const savedPlan = response.data;
      applyPlans([
        savedPlan,
        ...plans.filter((existing) => existing.id !== savedPlan.id),
      ].sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0)));
      setEditing(false);
      toast.success(plan?.id ? "Diet plan updated." : "Diet plan created.");
      try {
        applyPlans(await fetchPlans());
      } catch (refreshError) {
        console.error("Diet plan saved but refresh failed", refreshError);
        toast.error("Plan saved, but could not refresh it from the server.");
      }
    } catch (error) {
      console.error("Failed to save member diet plan", error);
      toast.error(error.response?.data?.error || error.message || "Failed to save diet plan.");
    } finally {
      setSaving(false);
    }
  };

  const exportPlan = () => {
    const rows = [];
    if (plan) {
      const savedForm = createPlanForm(plan);
      savedForm.days.forEach((day, dayIndex) => {
        meals.forEach((meal) => {
          const mealData = day[meal];
          const items = mealData.items.length ? mealData.items : [{ food: "", quantity: "", calories: "" }];
          items.forEach((item) => {
            if (item.food || item.quantity || item.calories || mealData.time) {
              rows.push({
                "Diet Title": plan.title || "",
                "Member ID": selectedMemberId,
                "Member Name": memberNameOf(member),
                Mobile: memberMobileOf(member),
                "Member Weight (kg)": plan.member_weight || "",
                "Duration (Days)": plan.duration || savedForm.days.length,
                Day: dayIndex + 1,
                Meal: meal,
                time: normalizeTime(mealData.time),
                Food: item.food || "",
                Qty: item.quantity || "",
                Kcal: item.calories || "",
              });
            }
          });
        });
        if (day.notes) {
          rows.push({ Day: dayIndex + 1, Meal: "Notes", time: "", Food: day.notes, Qty: "", Kcal: "" });
        }
      });
    }
    const worksheet = rows.length
      ? XLSX.utils.json_to_sheet(rows, { header: dietExportColumns })
      : XLSX.utils.aoa_to_sheet([dietExportColumns]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Diet Plan");
    XLSX.writeFile(workbook, `Diet_Plan_${selectedMemberId}.xlsx`);
    toast.success(rows.length ? "Diet plan exported." : "Blank diet template downloaded.");
  };

  const importPlan = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("The workbook does not contain a worksheet.");
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
      if (!rows.length) throw new Error("Excel file is empty or invalid.");

      const parsedDays = {};
      rows.forEach((row) => {
        const rowMemberId = getCell(row, ["Member ID", "MemberID", "member_id"]);
        const rowMemberName = getCell(row, ["Member Name", "MemberName"]);
        const rowMobile = getCell(row, ["Mobile", "Phone", "Mobile Number"]);
        if (rowMemberId && rowMemberId !== String(selectedMemberId)) {
          throw new Error("This file contains a different member ID.");
        }
        if (rowMemberName && rowMemberName.toLowerCase() !== memberNameOf(member).trim().toLowerCase()) {
          throw new Error("This file contains a different member name.");
        }
        if (rowMobile && memberMobileOf(member) &&
            normalizeMobile(rowMobile) !== normalizeMobile(memberMobileOf(member))) {
          throw new Error("This file contains a different member phone number.");
        }

        const dayValue = getCell(row, ["Day", "Day Number", "Day No", "DayNo", "Day#", "day"]);
        const dayNumber = Number(dayValue.match(/\d+/)?.[0] || 1);
        if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 60) {
          throw new Error("Diet plans must contain between 1 and 60 days.");
        }
        const meal = normalizeMeal(getCell(row, ["Meal", "Meal Name", "Meal Type", "MealType", "meal"]));
        const time = getCell(row, ["Time", "Timing", "Meal Time", "MealTime", "time"]);
        const food = getCell(row, ["Food", "Food Item", "FoodItem", "Item", "Description", "food"]);
        const quantity = getCell(row, ["Qty", "Quantity", "QTY", "Serving", "quantity"]);
        const calories = getCell(row, ["Kcal", "Calories", "Cal", "Energy", "calories"]);
        if (/^notes?$/i.test(getCell(row, ["Meal", "Meal Name", "Meal Type", "MealType"]))) {
          const noteDay = `Day${dayNumber}`;
          parsedDays[noteDay] ||= {};
          parsedDays[noteDay].notes = food;
          return;
        }
        if (!meal) throw new Error("Every imported row must specify a supported meal.");
        if (!food && !quantity && !calories) {
          throw new Error(`Add a food item or nutritional detail for Day ${dayNumber}, ${meal}.`);
        }
        const dayKey = `Day${dayNumber}`;
        parsedDays[dayKey] ||= {};
        parsedDays[dayKey][meal] ||= { time: "", items: [] };
        if (time) parsedDays[dayKey][meal].time = time;
        parsedDays[dayKey][meal].items.push({ food, quantity, calories });
      });
      if (!Object.keys(parsedDays).length) {
        throw new Error("No valid diet rows found. Use Day, Meal, Time, Food, Qty, Kcal columns.");
      }

      const dayCount = Math.max(...Object.keys(parsedDays).map((key) => Number(key.replace(/\D/g, ""))));
      const days = Array.from({ length: dayCount }, (_, index) => {
        const day = createDay();
        const importedDay = parsedDays[`Day${index + 1}`] || {};
        meals.forEach((meal) => {
          if (importedDay[meal]) {
            day[meal] = {
              time: importedDay[meal].time,
              items: importedDay[meal].items,
            };
          }
        });
        day.notes = importedDay.notes || "";
        return day;
      });
      const importedTitle = getCell(rows[0], ["Diet Title", "Title"]);
      const importedWeight = getCell(rows[0], ["Member Weight (kg)", "Member Weight"]);
      setForm((previous) => ({
        ...previous,
        ...(importedTitle && { title: importedTitle }),
        ...(importedWeight && { memberWeight: importedWeight }),
        days,
      }));
      setEditing(true);
      toast.success(`Imported diet plan for ${days.length} day(s). Review it, then save.`);
    } catch (error) {
      console.error("Failed to import member diet plan", error);
      toast.error(error.message || "Failed to import diet plan. Check the Excel format.");
    }
  };

  if (loading) return <div className="p-12 text-center text-white/50">Loading diet plan...</div>;
  if (loadError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-300">{loadError}</p>
        <button onClick={reloadPlans} className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-white">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-end gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">
          <FileUp size={16} /> Import Excel
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={importPlan} />
        </label>
        <button onClick={exportPlan} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">
          <Download size={16} /> Export
        </button>
        {plan && !editing && (
          <>
            <button onClick={beginAddingDay} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700">
              <Plus size={16} /> Add Day / Meal
            </button>
            <button onClick={() => { setForm(createPlanForm(plan)); setEditing(true); }} className="rounded-lg bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/30">
              Edit Diet Plan
            </button>
          </>
        )}
        {!plan && !editing && (
          <button onClick={() => { setForm(createPlanForm(null)); setEditing(true); }} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700">
            <Plus size={16} /> Add Diet Plan
          </button>
        )}
      </div>

      {!plan && !editing && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-white/50">No diet plan assigned</p>
          <p className="mt-1 text-xs text-white/30">Add a plan or import a diet plan for this member.</p>
        </div>
      )}

      {plan && !editing && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h4 className="font-bold text-amber-300">{plan.title || "Diet Plan"}</h4>
            <p className="mt-1 text-xs text-white/50">
              {plan.duration || createPlanForm(plan).days.length} day(s) · {plan.total_calories || plan.totalCalories || totalCalories} kcal · {plan.member_weight || "Weight not specified"}{plan.member_weight ? " kg" : ""}
            </p>
          </div>
          {createPlanForm(plan).days.map((day, dayIndex) => (
            <section key={dayIndex} className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="font-bold text-amber-300">Day {dayIndex + 1}</h4>
              {meals.map((meal) => {
                const mealData = day[meal];
                const items = mealData.items.filter((item) => item.food || item.quantity || item.calories);
                if (!items.length && !mealData.time) return null;
                return (
                  <div key={meal} className="rounded-lg border border-white/5 bg-black/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h5 className="text-xs font-bold uppercase text-amber-300">{meal}</h5>
                      {mealData.time && <span className="text-xs text-white/60">{mealData.time}</span>}
                    </div>
                    {items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex flex-wrap justify-between gap-2 border-t border-white/5 py-2 text-sm">
                        <span className="text-white">{item.food || "—"}{item.quantity && <span className="ml-2 text-xs text-white/50">Qty: {item.quantity}</span>}</span>
                        <span className="font-semibold text-emerald-300">{item.calories || 0} kcal</span>
                      </div>
                    ))}
                  </div>
                );
              })}
              {day.notes && <p className="text-sm text-white/60">Notes: {day.notes}</p>}
            </section>
          ))}
        </div>
      )}

      {editing && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-white/5 p-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">Diet Plan Title</label>
              <select className={inputClass} value={form.title} onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}>
                <option value="">Select Diet Plan Title...</option>
                {form.title && !["Weight Loss Strategy", "High Protein Bulk", "Keto Diet Plan", "Lean Muscle Building", "General Fitness", "Endurance & Stamina", "Vegan Plan"].includes(form.title) && <option value={form.title}>{form.title}</option>}
                {["Weight Loss Strategy", "High Protein Bulk", "Keto Diet Plan", "Lean Muscle Building", "General Fitness", "Endurance & Stamina", "Vegan Plan"].map((title) => <option key={title}>{title}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Total Calories (Auto)</label>
              <input className={inputClass} value={totalCalories} readOnly />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Member Weight (kg)</label>
              <input className={inputClass} type="number" step="0.1" value={form.memberWeight} onChange={(event) => setForm((previous) => ({ ...previous, memberWeight: event.target.value }))} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2 text-sm text-white/70 sm:col-span-3">
              <span>Duration: {form.days.length} day(s)</span>
              <div className="flex gap-3">
                <button type="button" onClick={removeDay} className="text-red-300" aria-label="Remove final day">-</button>
                <button type="button" onClick={addDay} className="text-amber-300" aria-label="Add day"><Plus size={16} /></button>
              </div>
            </div>
          </div>

          <div className="max-h-[58vh] space-y-5 overflow-y-auto pr-1">
            {form.days.map((day, dayIndex) => (
              <section key={dayIndex} className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-300">Day {dayIndex + 1}</h4>
                  {dayIndex === 0 && form.days.length > 1 && (
                    <button type="button" onClick={() => setForm((previous) => ({
                      ...previous,
                      days: previous.days.map((item, index) => index === 0 ? item : JSON.parse(JSON.stringify(previous.days[0]))),
                    }))} className="text-xs text-amber-200">Copy Day 1 to All</button>
                  )}
                </div>
                {meals.map((meal) => (
                  <div key={meal} className="min-w-0 space-y-2 rounded-lg border border-white/5 bg-white/5 p-3">
                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_150px] items-center gap-2">
                      <h5 className="self-center text-xs font-bold uppercase text-amber-300">{meal}</h5>
                      <input className={`${inputClass} min-w-0`} type="time" aria-label={`${meal} time`} value={day[meal].time} onChange={(event) => updateMeal(dayIndex, meal, { time: event.target.value })} />
                    </div>
                    {day[meal].items.map((item, itemIndex) => (
                      <div key={itemIndex} className="overflow-x-auto">
                        <div className="grid w-full min-w-[560px] grid-cols-[minmax(0,1fr)_130px_110px_36px] items-center gap-2">
                          <input className={`${inputClass} min-w-0`} placeholder="Food Item" value={item.food} onChange={(event) => updateFoodItem(dayIndex, meal, itemIndex, "food", event.target.value)} />
                          <input className={`${inputClass} min-w-0`} placeholder="Qty / Serving" value={item.quantity} onChange={(event) => updateFoodItem(dayIndex, meal, itemIndex, "quantity", event.target.value)} />
                          <input className={`${inputClass} min-w-0`} type="number" min="0" placeholder="Kcal" value={item.calories} onChange={(event) => updateFoodItem(dayIndex, meal, itemIndex, "calories", event.target.value)} />
                          <button type="button" onClick={() => removeFoodItem(dayIndex, meal, itemIndex)} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:bg-red-500/20 hover:text-red-300" aria-label="Remove food item"><X size={16} /></button>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => addFoodItem(dayIndex, meal)} className="inline-flex items-center gap-1 text-xs text-amber-200"><Plus size={14} /> Add Food Item</button>
                  </div>
                ))}
                <textarea className={`${inputClass} min-h-20`} placeholder="Day notes" value={day.notes} onChange={(event) => updateNotes(dayIndex, event.target.value)} />
              </section>
            ))}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => { setForm(createPlanForm(plan)); setEditing(false); }} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15">Cancel</button>
            <button type="button" onClick={savePlan} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50">
              <Save size={16} /> {saving ? "Saving..." : plan ? "Update Plan" : "Save Plan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMemberDietPlan;
