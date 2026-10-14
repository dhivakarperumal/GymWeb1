import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Dumbbell, FileUp, Plus, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import api from "../../api";

const workoutTypes = [
  "Weight Training",
  "Cardio",
  "Yoga / Stretching",
  "HIIT",
  "Bodyweight",
  "Mobility",
  "Activity",
  "Stability",
  "Warm Up",
  "Cool Down",
  "Rest Day",
];

const inputClass =
  "w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-500";

const createExercise = (exercise = {}) => ({
  time: "",
  type: "Weight Training",
  name: "",
  sets: "",
  count: "",
  massGain: "",
  media: "",
  mediaType: "url",
  ...exercise,
});

const normalizeDayKey = (key) => {
  const number = Number(String(key || "").match(/\d+/)?.[0] || 1);
  return `Day${number > 0 ? number : 1}`;
};

const normalizeDays = (value) => {
  let days = value;
  if (typeof days === "string") {
    try {
      days = JSON.parse(days);
    } catch {
      days = null;
    }
  }
  if (Array.isArray(days)) {
    return days.reduce((result, exercises, index) => {
      result[`Day${index + 1}`] = (Array.isArray(exercises) ? exercises : [exercises])
        .map((exercise) => createExercise(exercise));
      return result;
    }, {});
  }
  if (days && typeof days === "object") {
    return Object.entries(days).reduce((result, [key, exercises]) => {
      result[normalizeDayKey(key)] = (Array.isArray(exercises) ? exercises : [exercises])
        .map((exercise) => createExercise(exercise));
      return result;
    }, {});
  }
  return { Day1: [createExercise()] };
};

const getMemberIds = (member) =>
  [member?.id, member?.member_id].filter((value) => value != null).map(String);

const belongsToMember = (workout, member) => {
  const memberIds = getMemberIds(member);
  const userIds = [member?.u_id, member?.user_id].filter((value) => value != null).map(String);
  const uuids = [member?.user_id_uuid, member?.uuid].filter(Boolean).map(String);
  const email = String(member?.email || member?.user_email || "").trim().toLowerCase();
  const mobile = String(member?.phone || member?.mobile || "").replace(/\D/g, "");

  if (workout.member_id != null) return memberIds.includes(String(workout.member_id));
  if (workout.user_id != null && userIds.includes(String(workout.user_id))) return true;
  if (workout.user_id_uuid && uuids.includes(String(workout.user_id_uuid))) return true;
  return (
    (email && String(workout.member_email || "").trim().toLowerCase() === email) ||
    (mobile && String(workout.member_mobile || "").replace(/\D/g, "") === mobile)
  );
};

const createFormFromWorkout = (workout) => {
  const days = normalizeDays(workout?.days);
  return {
    category: workout?.category || "",
    level: workout?.level || "Beginner",
    goal: workout?.goal || "",
    memberWeight: workout?.member_weight || "",
    days,
    dayOrder: Object.keys(days),
    dayNames: Object.fromEntries(
      Object.entries(days).map(([dayKey, exercises]) => [
        dayKey,
        exercises[0]?.dayName ?? dayKey.replace(/(\D)(\d+)/, "$1 $2"),
      ]),
    ),
  };
};

const getDaysWithNames = (days, dayNames, dayOrder = Object.keys(days)) =>
  Object.fromEntries(
    dayOrder.filter((dayKey) => days[dayKey]).map((dayKey) => [
      dayKey,
      days[dayKey].map((exercise) => ({
        ...exercise,
        dayName: dayNames[dayKey] ?? dayKey.replace(/(\D)(\d+)/, "$1 $2"),
      })),
    ]),
  );

const sortedDays = (days) => Object.keys(days);

const getNextDayKey = (days) => {
  const existingNumbers = new Set(
    Object.keys(days).map((dayKey) => Number(dayKey.replace(/\D/g, ""))),
  );
  let number = 1;
  while (existingNumbers.has(number)) number += 1;
  return `Day${number}`;
};

const renumberDefaultDayNames = (dayOrder, dayNames) =>
  dayOrder.reduce((nextNames, dayKey, index) => {
    const name = dayNames[dayKey] ?? dayKey.replace(/(\D)(\d+)/, "$1 $2");
    nextNames[dayKey] = /^Day\s*\d+$/i.test(String(name).trim())
      ? `Day ${index + 1}`
      : name;
    return nextNames;
  }, {});

const memberName = (member) => member?.name || member?.username || "Member";
const memberEmail = (member) => member?.email || member?.user_email || "";
const memberMobile = (member) => member?.phone || member?.mobile || member?.user_mobile || "";

const workoutExportColumns = [
  "Member ID",
  "Member Name",
  "Mobile",
  "Training Level",
  "Workout Goal",
  "Duration (Weeks)",
  "Day",
  "Time",
  "Type",
  "Exercise Name",
  "Sets",
  "Count",
  "Muscle Type",
  "Media",
];

const AdminMemberWorkoutPlan = ({ member, creator }) => {
  const memberId = member?.id || member?.member_id;
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => createFormFromWorkout(null));

  const plan = plans[0] || null;
  const dayKeys = useMemo(
    () => form.dayOrder.filter((dayKey) => form.days[dayKey]),
    [form.dayOrder, form.days],
  );
  const exerciseCount = useMemo(
    () => Object.values(form.days).reduce((count, exercises) => count + exercises.length, 0),
    [form.days],
  );

  const fetchPlans = useCallback(async () => {
    const response = await api.get(`/workouts?memberId=${encodeURIComponent(memberId)}`);
    if (!Array.isArray(response.data)) {
      throw new Error("The workout API returned an invalid response.");
    }
    return response.data
      .filter((workout) => belongsToMember(workout, member))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [member, memberId]);

  const acceptPlans = useCallback((nextPlans) => {
    setPlans(nextPlans);
    setLoadError("");
    if (nextPlans.length > 0) setForm(createFormFromWorkout(nextPlans[0]));
  }, []);

  const handleLoadError = useCallback((error) => {
    console.error("Failed to load member workout plan", error);
    setPlans([]);
    setLoadError(error.response?.data?.error || error.message || "Failed to load workout plan.");
  }, []);

  useEffect(() => {
    let active = true;
    fetchPlans()
      .then((nextPlans) => {
        if (active) acceptPlans(nextPlans);
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
  }, [acceptPlans, fetchPlans, handleLoadError]);

  const reloadPlans = async () => {
    setLoading(true);
    try {
      acceptPlans(await fetchPlans());
    } catch (error) {
      handleLoadError(error);
    } finally {
      setLoading(false);
    }
  };

  const beginEditing = () => {
    setForm(createFormFromWorkout(plan));
    setEditing(true);
  };

  const beginAddingDay = () => {
    const currentForm = createFormFromWorkout(plan);
    if (currentForm.dayOrder.length >= 60) {
      toast.error("Maximum 60 days allowed.");
      return;
    }
    const nextDayKey = getNextDayKey(currentForm.days);
    const dayOrder = [...currentForm.dayOrder, nextDayKey];
    const dayNames = renumberDefaultDayNames(dayOrder, {
      ...currentForm.dayNames,
      [nextDayKey]: `Day ${dayOrder.length}`,
    });
    setForm({
      ...currentForm,
      days: {
        ...currentForm.days,
        [nextDayKey]: [createExercise()],
      },
      dayOrder,
      dayNames,
    });
    setEditing(true);
  };

  const updateExercise = (dayKey, index, field, value) => {
    setForm((previous) => ({
      ...previous,
      days: {
        ...previous.days,
        [dayKey]: previous.days[dayKey].map((exercise, exerciseIndex) =>
          exerciseIndex === index ? { ...exercise, [field]: value } : exercise,
        ),
      },
    }));
  };

  const addDay = (afterDayIndex = null) => {
    if (dayKeys.length >= 60) {
      toast.error("Maximum 60 days allowed.");
      return;
    }
    setForm((previous) => {
      const nextDayKey = getNextDayKey(previous.days);
      const insertIndex = afterDayIndex == null
        ? previous.dayOrder.length
        : afterDayIndex + 1;
      const dayOrder = [...previous.dayOrder];
      dayOrder.splice(insertIndex, 0, nextDayKey);
      const dayNames = renumberDefaultDayNames(dayOrder, {
        ...previous.dayNames,
        [nextDayKey]: `Day ${insertIndex + 1}`,
      });
      return {
        ...previous,
        days: { ...previous.days, [nextDayKey]: [createExercise()] },
        dayOrder,
        dayNames,
      };
    });
  };

  const removeDay = (dayKey) => {
    setForm((previous) => {
      const nextDays = { ...previous.days };
      delete nextDays[dayKey];
      const nextDayNames = { ...previous.dayNames };
      delete nextDayNames[dayKey];
      const dayOrder = previous.dayOrder.filter((key) => key !== dayKey);
      if (Object.keys(nextDays).length === 0) {
        nextDays.Day1 = [createExercise()];
        nextDayNames.Day1 = "Day 1";
        dayOrder.push("Day1");
      }
      const dayNames = renumberDefaultDayNames(dayOrder, nextDayNames);
      return {
        ...previous,
        days: nextDays,
        dayOrder,
        dayNames,
      };
    });
  };

  const updateDayName = (dayKey, value) => {
    setForm((previous) => ({
      ...previous,
      dayNames: { ...previous.dayNames, [dayKey]: value },
    }));
  };

  const copyDayToAll = (sourceDayKey) => {
    setForm((previous) => {
      const sourceExercises = previous.days[sourceDayKey];
      const days = Object.fromEntries(
        previous.dayOrder.map((dayKey) => [
          dayKey,
          dayKey === sourceDayKey
            ? sourceExercises
            : sourceExercises.map((exercise) => ({ ...exercise })),
        ]),
      );
      return { ...previous, days };
    });
    toast.success(`${form.dayNames[sourceDayKey]} copied to all days.`);
  };

  const addExercise = (dayKey) => {
    setForm((previous) => ({
      ...previous,
      days: { ...previous.days, [dayKey]: [...previous.days[dayKey], createExercise()] },
    }));
  };

  const removeExercise = (dayKey, index) => {
    setForm((previous) => {
      const remaining = previous.days[dayKey].filter((_, exerciseIndex) => exerciseIndex !== index);
      return {
        ...previous,
        days: {
          ...previous.days,
          [dayKey]: remaining.length ? remaining : [createExercise()],
        },
      };
    });
  };

  const savePlan = async () => {
    const exercises = Object.values(form.days).flat();
    if (!exercises.some((exercise) => exercise.name.trim())) {
      toast.error("Add at least one exercise before saving.");
      return;
    }
    if (!memberId) {
      toast.error("Member ID is unavailable.");
      return;
    }

    const gymMemberId = member.id || member.member_id;
    const userId = member.u_id || member.user_id || gymMemberId;
    const trainerId = plan?.trainer_id ?? creator?.id ?? member.trainer_id ?? member.trainerId;
    if (!trainerId) {
      toast.error("A trainer or account ID is required to assign this workout plan.");
      return;
    }
    const payload = {
      trainerId,
      trainerName: plan?.trainer_name ?? creator?.username ?? creator?.name ?? null,
      trainerSource: plan?.trainer_source ?? (creator ? "admin-members" : null),
      memberId: gymMemberId,
      userId,
      memberName: memberName(member),
      memberEmail: memberEmail(member),
      memberMobile: memberMobile(member),
      memberWeight: form.memberWeight || member.weight || "",
      category: form.category,
      level: form.level,
      goal: form.goal,
      durationWeeks: Math.ceil(Object.keys(form.days).length / 7),
      days: getDaysWithNames(form.days, form.dayNames, form.dayOrder),
      status: plan?.status || "active",
    };

    setSaving(true);
    try {
      let response;
      if (plan?.id) {
        response = await api.put(`/workouts/${plan.id}`, payload);
      } else {
        response = await api.post("/workouts", payload);
      }
      if (!response.data) {
        throw new Error("The workout API did not confirm the saved plan.");
      }
      const savedPlan = response.data;
      acceptPlans([
        savedPlan,
        ...plans.filter((existing) => existing.id !== savedPlan.id),
      ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
      setEditing(false);
      toast.success(plan?.id ? "Workout plan updated." : "Workout plan created.");
      try {
        acceptPlans(await fetchPlans());
      } catch (refreshError) {
        console.error("Workout plan saved but could not be refreshed", refreshError);
        toast.error("Plan saved, but could not refresh from the server.");
      }
    } catch (error) {
      console.error("Failed to save member workout plan", error);
      toast.error(error.response?.data?.error || "Failed to save workout plan.");
    } finally {
      setSaving(false);
    }
  };

  const exportPlan = () => {
    const rows = [];
    if (plan) {
      const days = normalizeDays(plan.days);
      sortedDays(days).forEach((day) => {
        days[day].forEach((exercise) => {
          rows.push({
            "Member ID": memberId,
            "Member Name": memberName(member),
            Mobile: memberMobile(member),
            "Training Level": plan.level || "Beginner",
            "Workout Goal": plan.goal || "",
            "Duration (Weeks)": plan.duration_weeks || Math.ceil(Object.keys(days).length / 7),
            Day: days[day][0]?.dayName || day,
            Time: exercise.time || "",
            Type: exercise.type || "Weight Training",
            "Exercise Name": exercise.name || "",
            Sets: exercise.sets || "",
            Count: exercise.count || "",
            "Muscle Type": exercise.massGain || "",
            Media: exercise.media || "",
          });
        });
      });
    }
    const worksheet = rows.length
      ? XLSX.utils.json_to_sheet(rows, { header: workoutExportColumns })
      : XLSX.utils.aoa_to_sheet([
          workoutExportColumns,
          [memberId, ...Array(workoutExportColumns.length - 1).fill("")],
        ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Member Workout Plan");
    XLSX.writeFile(workbook, `Workout_Plan_${memberId}.xlsx`);
    toast.success(rows.length ? "Workout plan exported." : "Blank workout template downloaded.");
  };

  const importPlan = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) throw new Error("The workbook does not contain a worksheet.");
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" });
      if (!rows.length) throw new Error("The worksheet contains no workout rows.");

      const expectedMobile = memberMobile(member).replace(/\D/g, "");
      const expectedName = memberName(member).trim().toLowerCase();
      const importedDays = {};
      let metadata = {};

      rows.forEach((row, index) => {
        const importedId = row["Member ID"] || row.MemberID || row.member_id;
        const importedName = String(row["Member Name"] || row.MemberName || "").trim().toLowerCase();
        const importedMobile = String(row.Mobile || row.Phone || row.mobile || "").replace(/\D/g, "");
        if (importedId && String(importedId) !== String(memberId)) {
          throw new Error("This file contains a different member ID.");
        }
        if (importedName && importedName !== expectedName) {
          throw new Error("This file contains a different member name.");
        }
        if (importedMobile && expectedMobile && importedMobile !== expectedMobile) {
          throw new Error("This file contains a different member phone number.");
        }
        if (index === 0) {
          const level = row["Training Level"] || row.Level || row.level;
          const goal = row["Workout Goal"] || row.Goal || row.goal;
          const category = row["Training Category"] || row.Category || row.category;
          const weight = row["Member Weight"] || row.memberWeight || "";
          metadata = {
            ...(level && { level: String(level) }),
            ...(goal && { goal: String(goal) }),
            ...(category && { category: String(category) }),
            ...(weight && { memberWeight: String(weight) }),
          };
        }

        const name = String(row["Exercise Name"] || row.exercise || row.name || "").trim();
        if (!name) return;
        const dayKey = normalizeDayKey(row.Day || row.day || row.DayNumber || row.dayNumber);
        if (!importedDays[dayKey]) importedDays[dayKey] = [];
        importedDays[dayKey].push(createExercise({
          time: row.Time || row.time || "",
          type: row.Type || row.type || "Weight Training",
          name,
          sets: row.Sets || row.sets || "",
          count: row.Count || row.count || row.Reps || row.reps || "",
          massGain: row["Muscle Type"] || row.massGain || "",
          media: row.Media || row.media || "",
        }));
      });

      if (!Object.keys(importedDays).length) {
        throw new Error("No valid exercises were found. Include Day and Exercise Name columns.");
      }
      setForm((previous) => ({
        ...createFormFromWorkout(plan),
        ...previous,
        ...metadata,
        days: importedDays,
        dayOrder: sortedDays(importedDays),
        dayNames: Object.fromEntries(
          Object.keys(importedDays).map((dayKey) => [
            dayKey,
            dayKey.replace(/(\D)(\d+)/, "$1 $2"),
          ]),
        ),
      }));
      setEditing(true);
      toast.success("Workout file imported. Review it, then save the plan.");
    } catch (error) {
      console.error("Failed to import member workout plan", error);
      toast.error(error.message || "Could not read this workout file.");
    }
  };

  const uploadMedia = async (dayKey, index, file) => {
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append("file", file);
    try {
      const response = await api.post("/workouts/upload", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateExercise(dayKey, index, "media", response.data.url);
      updateExercise(dayKey, index, "mediaType", "upload");
      toast.success("Exercise media uploaded.");
    } catch (error) {
      console.error("Failed to upload workout media", error);
      toast.error(error.response?.data?.error || "Exercise media upload failed.");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-white/50">Loading workout plan...</div>;
  }
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
          <FileUp size={16} /> Import
          <input type="file" accept=".xlsx,.xls" className="hidden" onChange={importPlan} />
        </label>
        <button onClick={exportPlan} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">
          <Download size={16} /> Export
        </button>
        {plan && !editing && (
          <>
            <button onClick={beginAddingDay} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700">
              <Plus size={16} /> Add Day / Exercise
            </button>
            <button onClick={beginEditing} className="inline-flex items-center gap-2 rounded-lg bg-blue-500/20 px-3 py-2 text-sm text-blue-200 hover:bg-blue-500/30">
              <Dumbbell size={16} /> Edit Plan
            </button>
          </>
        )}
        {!editing && !plan && (
          <button onClick={beginEditing} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700">
            <Plus size={16} /> Add Workout Plan
          </button>
        )}
      </div>

      {!plan && !editing && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Dumbbell size={48} className="mb-3 text-white/20" />
          <p className="text-sm text-white/50">No workout plan assigned</p>
          <p className="mt-1 text-xs text-white/30">Add a plan or import one for this member.</p>
        </div>
      )}

      {plan && !editing && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm sm:grid-cols-4">
            <div><span className="block text-xs text-white/40">Level</span><span className="text-white">{plan.level || "Beginner"}</span></div>
            <div><span className="block text-xs text-white/40">Goal</span><span className="text-white">{plan.goal || "—"}</span></div>
            <div><span className="block text-xs text-white/40">Duration</span><span className="text-white">{plan.duration_weeks || Math.ceil(Object.keys(normalizeDays(plan.days)).length / 7)} week(s)</span></div>
            <div><span className="block text-xs text-white/40">Status</span><span className="text-white">{plan.status || "Active"}</span></div>
          </div>
          {sortedDays(normalizeDays(plan.days)).map((dayKey) => (
            <section key={dayKey} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="mb-3 font-bold text-white">{normalizeDays(plan.days)[dayKey][0]?.dayName || dayKey.replace(/(\D)(\d+)/, "$1 $2")}</h4>
              <div className="space-y-2">
                {normalizeDays(plan.days)[dayKey].map((exercise, index) => (
                  <div key={`${dayKey}-${index}`} className="grid grid-cols-2 gap-2 rounded-lg bg-black/20 p-3 text-sm text-white/80 sm:grid-cols-4">
                    <span className="font-semibold text-white">{exercise.name || "Unnamed exercise"}</span>
                    <span>{exercise.type || "Weight Training"}</span>
                    <span>{exercise.time || "—"} · {exercise.sets || "—"} sets · {exercise.count || "—"} reps</span>
                    {exercise.media && <a href={exercise.media} target="_blank" rel="noreferrer" className="text-green-300 underline">View media</a>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-white/5 p-4 md:grid-cols-3">
            <div><label className="mb-1 block text-xs text-white/50">Training Level</label>
              <select className={inputClass} value={form.level} onChange={(event) => setForm((previous) => ({ ...previous, level: event.target.value }))}>
                {["Beginner", "Intermediate", "Advanced"].map((level) => <option key={level}>{level}</option>)}
              </select>
            </div>
            <div><label className="mb-1 block text-xs text-white/50">Workout Goal</label>
              <input className={inputClass} value={form.goal} placeholder="e.g. Weight Loss, Muscle Gain" onChange={(event) => setForm((previous) => ({ ...previous, goal: event.target.value }))} />
            </div>
            <div><label className="mb-1 block text-xs text-white/50">Category</label>
              <input className={inputClass} value={form.category} placeholder="Training category" onChange={(event) => setForm((previous) => ({ ...previous, category: event.target.value }))} />
            </div>
            <div><label className="mb-1 block text-xs text-white/50">Member Weight</label>
              <input className={inputClass} value={form.memberWeight} placeholder="Member weight" onChange={(event) => setForm((previous) => ({ ...previous, memberWeight: event.target.value }))} />
            </div>
            <div className="flex items-end justify-between rounded-lg bg-black/30 px-3 py-2 text-sm text-white/70">
              <span>{dayKeys.length} workout day(s)</span>
              <button type="button" onClick={() => addDay()} disabled={dayKeys.length >= 60} className="inline-flex items-center gap-1 text-green-300 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={16} /> Add day</button>
            </div>
          </div>

          {dayKeys.map((dayKey, dayIndex) => (
            <React.Fragment key={dayKey}>
            <section className="space-y-3 rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <input
                  type="text"
                  aria-label={`Name for ${dayKey.replace(/(\D)(\d+)/, "$1 $2")}`}
                  value={form.dayNames[dayKey] ?? dayKey.replace(/(\D)(\d+)/, "$1 $2")}
                  onChange={(event) => updateDayName(dayKey, event.target.value)}
                  className="w-[130px] shrink-0 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm font-bold text-white outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500"
                />
                <div className="flex items-center gap-3">
                  {dayKeys.length > 1 && (
                    <button
                      type="button"
                      onClick={() => copyDayToAll(dayKey)}
                      className="text-xs font-semibold text-green-300 hover:text-green-200"
                    >
                      Copy to All Days
                    </button>
                  )}
                  {dayKeys.length > 1 && <button type="button" onClick={() => removeDay(dayKey)} className="text-xs text-red-300 hover:text-red-200">Remove day</button>}
                </div>
              </div>
              {form.days[dayKey].map((exercise, index) => (
                <div key={`${dayKey}-${index}`} className="grid grid-cols-1 gap-3 rounded-lg border border-white/10 bg-white/5 p-3 sm:grid-cols-2 lg:grid-cols-4">
                  <input className={inputClass} type="time" aria-label="Exercise time" value={exercise.time} onChange={(event) => updateExercise(dayKey, index, "time", event.target.value)} />
                  <select className={inputClass} aria-label="Exercise type" value={exercise.type} onChange={(event) => updateExercise(dayKey, index, "type", event.target.value)}>
                    {workoutTypes.map((type) => <option key={type}>{type}</option>)}
                  </select>
                  <input className={inputClass} placeholder="Exercise name" value={exercise.name} onChange={(event) => updateExercise(dayKey, index, "name", event.target.value)} />
                  <input className={inputClass} type="number" min="0" placeholder="Sets" value={exercise.sets} onChange={(event) => updateExercise(dayKey, index, "sets", event.target.value)} />
                  <input className={inputClass} placeholder="Reps / count" value={exercise.count} onChange={(event) => updateExercise(dayKey, index, "count", event.target.value)} />
                  <input className={inputClass} placeholder="Muscle type" value={exercise.massGain} onChange={(event) => updateExercise(dayKey, index, "massGain", event.target.value)} />
                  <input className={inputClass} placeholder="Exercise media URL" value={exercise.media} onChange={(event) => updateExercise(dayKey, index, "media", event.target.value)} />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/10">
                      Upload media
                      <input type="file" accept="image/*,video/*" className="hidden" onChange={(event) => uploadMedia(dayKey, index, event.target.files?.[0])} />
                    </label>
                    <button type="button" onClick={() => removeExercise(dayKey, index)} className="inline-flex items-center gap-1 text-xs text-red-300"><X size={14} /> Remove</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addExercise(dayKey)} className="inline-flex items-center gap-1 text-sm text-green-300 hover:text-green-200"><Plus size={16} /> Add exercise</button>
            </section>
            {dayIndex < dayKeys.length - 1 && (
              <div className="flex justify-center py-1">
                <button
                  type="button"
                  onClick={() => addDay(dayIndex)}
                  disabled={dayKeys.length >= 60}
                  className="inline-flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-300 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={16} /> Add Day
                </button>
              </div>
            )}
            </React.Fragment>
          ))}

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => { setEditing(false); setForm(createFormFromWorkout(plan)); }} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15">Cancel</button>
            <button type="button" onClick={savePlan} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50">
              <Save size={16} /> {saving ? "Saving..." : plan ? "Update Plan" : "Save Plan"}
            </button>
          </div>
          <p className="text-xs text-white/35">{exerciseCount} exercise row(s); exercise names are required for at least one row.</p>
        </div>
      )}
    </div>
  );
};

export default AdminMemberWorkoutPlan;
