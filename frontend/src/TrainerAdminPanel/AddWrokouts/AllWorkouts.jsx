import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Edit2, Eye, Trash2, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import * as XLSX from "xlsx";
import api from "../../api";

const weekDays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const timeSlots = [
  "06:00 - 08:00",
];

const AllWorkouts = () => {
  const { user } = useAuth();
  const trainerId = user ? Number(user.id) : undefined;

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const navigate=useNavigate();

  const filteredWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      if (!w) return false;
      const matchesSearch = `${w.memberName || ''} ${w.goal || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory = categoryFilter ? w.category === categoryFilter : true;
      const matchesLevel = levelFilter ? w.level === levelFilter : true;

      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [workouts, search, categoryFilter, levelFilter]);

  /* ---------------- FETCH WORKOUT PROGRAMS ---------------- */
  useEffect(() => {
    if (!trainerId) return;
    setLoading(true);

    api.get(`/workouts?trainerId=${encodeURIComponent(trainerId)}`)
      .then((res) => {
        const data = res.data;
        // convert snake_case database fields to camelCase; keep legacy shape
        const normalized = data.map((w) => ({
          id: w.id,
          trainerId: w.trainer_id,
          trainerName: w.trainer_name,
          trainerSource: w.trainer_source,
          memberId: w.member_id,
          memberName: w.member_name,
          category: w.category,
          level: w.level,
          goal: w.goal,
          durationWeeks: w.duration_weeks || Math.ceil(Object.keys(typeof w.days === 'string' ? JSON.parse(w.days || '{}') : (w.days || {})).length / 7) || 1,
          days: typeof w.days === 'string' ? JSON.parse(w.days || '{}') : w.days,
          status: w.status,
          createdAt: w.created_at,
          updatedAt: w.updated_at,
        }));
        setWorkouts(normalized);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load workouts");
      })
      .finally(() => setLoading(false));
  }, [trainerId]);

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this workout program?")) return;

    try {
      await api.delete(`/workouts/${id}`);
      toast.success("Workout deleted");
      // refresh list after deletion
      setWorkouts((w) => w.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  /* ---------------- EXPORT TO EXCEL ---------------- */
  const exportToExcel = () => {
    if (workouts.length === 0) {
      toast.error("No workouts to export");
      return;
    }

    const dataToExport = filteredWorkouts.map((w, index) => ({
      "S.No": index + 1,
      "Member Name": w.memberName || "N/A",
      "Trainer Name": w.trainerName || "N/A",
      "Level": w.level || "N/A",
      "Category": w.category || "N/A",
      "Goal": w.goal || "N/A",
      "Duration (Weeks)": w.durationWeeks || 0,
      "Created At": w.createdAt ? new Date(w.createdAt).toLocaleDateString() : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Workouts");
    XLSX.writeFile(workbook, `Workouts_Report_${new Date().toLocaleDateString()}.xlsx`);
    toast.success("Workouts exported successfully");
  };


  /* ---------------- RESET WEEK WHEN MODAL OPENS ---------------- */
  useEffect(() => {
    if (selectedWorkout) {
      setSelectedWeek(1);
    }
  }, [selectedWorkout]);


  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search by member or goal..."
    className="w-full sm:w-64 px-4 py-2 
               bg-white/10 border border-white/20 
               rounded-lg focus:outline-none 
               focus:ring-2 focus:ring-cyan-500"
  />

          <div className="flex flex-col gap-3 
                sm:flex-row sm:flex-wrap 
                sm:items-center sm:gap-3 
                w-full sm:w-auto">

  
 

  {/* Category Filter */}
  <select
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
    className="w-full sm:w-48 px-4 py-2 
               bg-white/10 border border-white/20 
               rounded-lg focus:outline-none 
               focus:ring-2 focus:ring-cyan-500"
  >
    <option value="">All Categories</option>
    {[...new Set(workouts.map(w => w.category).filter(Boolean))].map(c => (
      <option key={c} value={c}>{c}</option>
    ))}
  </select>

  {/* Level Filter */}
  <select
    value={levelFilter}
    onChange={(e) => setLevelFilter(e.target.value)}
    className="w-full sm:w-48 px-4 py-2 
               bg-white/10 border border-white/20 
               rounded-lg focus:outline-none 
               focus:ring-2 focus:ring-cyan-500"
  >
    <option value="">All Levels</option>
    {[...new Set(workouts.map(w => w.level).filter(Boolean))].map(l => (
      <option key={l} value={l}>{l}</option>
    ))}
  </select>


  {/* Add Button */}
  <button
    onClick={() => navigate('/trainer/addworkouts')}
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

        {/* ---------------- TABLE (desktop) ---------------- */}
        <div className="hidden sm:block overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-[640px] w-full text-sm text-left">
            <thead className="bg-white/10 text-gray-300">
              <tr>
                <th className="px-4 py-4">S No</th>
                <th className="px-4 py-4">Member</th>
              
                <th className="px-4 py-4">Level</th>
                
                <th className="px-4 py-4">Duration</th>
                <th className="px-4 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {workouts.filter(Boolean).length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-400">
                    No workout programs added yet
                  </td>
                </tr>
              ) : (
                filteredWorkouts.map((w, index) => (
                  <tr
                    key={w.id}
                    className="border-b border-white/10 hover:bg-white/5"
                  >
                    <td className="px-4 py-4">{index + 1}</td>
                    <td className="px-4 py-4">{w.memberName}</td>
                   
                    <td className="px-4 py-4">{w.level}</td>
               
                    <td className="px-4 py-4">
                      {w.durationWeeks} weeks
                    </td>

                    <td className="px-4 py-4 text-center space-x-3">

                      <button
                        onClick={() => setSelectedWorkout(w)}
                        className="p-2 rounded-full bg-yellow-500 text-white border border-yellow-500/30 hover:bg-yellow-500/30 transition"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/trainer/addworkouts/${w.id}`)}
                        className="p-2 rounded-full bg-green-500 text-white hover:bg-green-500"
                      >
                        <Edit2 size={18} />
                      </button>

                      <button
                        onClick={() => handleDelete(w.id)}
                        className="p-2 rounded-full bg-red-500 text-white border border-red-500/30 hover:bg-red-500/30 transition"
                      >
                        <Trash2 size={18} />
                      </button>

                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>

          {/* ---------------- CARDS (mobile) ---------------- */}
          <div className="sm:hidden space-y-4">
            {filteredWorkouts.length === 0 ? (
              <div className="text-center py-6 text-gray-400">No workout programs added yet</div>
            ) : (
              filteredWorkouts.map((w, index) => (
                <div key={w.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-300 font-semibold">{w.memberName || 'Member'}</p>
                      <p className="text-xs text-gray-400">{w.category} • {w.level}</p>
                      <p className="text-xs text-gray-400 mt-2">Goal: {w.goal}</p>
                      <p className="text-xs text-gray-400">Duration: {w.durationWeeks} weeks</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedWorkout(w)} className="p-2 rounded-full bg-yellow-500 text-white">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => navigate(`/trainer/addworkouts/${w.id}`)} className="p-2 rounded-full bg-green-500 text-white">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(w.id)} className="p-2 rounded-full bg-red-500 text-white">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <span className="text-xs text-gray-400">#{index+1}</span>
                    </div>
                  </div>
                </div>
              ))
              )}
          </div>

        {/* ---------------- VIEW MODAL ---------------- */}
        {selectedWorkout && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedWorkout(null)}
          >
            <div
              className="bg-gray-950/90 border border-white/10 w-full max-w-7xl rounded-3xl p-8 overflow-hidden shadow-2xl backdrop-blur-2xl flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >

              {/* HEADER & NAV */}
              {(() => {
                // Calculate dynamic time slots for THIS specific workout
                const times = new Set();
                const workoutDays = selectedWorkout.days || {};
                Object.values(workoutDays).forEach(dayEx => {
                  if (Array.isArray(dayEx)) {
                    dayEx.forEach(ex => {
                      if (ex.time) times.add(ex.time);
                    });
                  }
                });
                const dynamicTimeSlots = Array.from(times).sort();
                if (dynamicTimeSlots.length === 0) dynamicTimeSlots.push("06:00 - 08:00");

                return (
                  <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div>
                    <h3 className="text-3xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                      Workout Timetable
                    </h3>
                    <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-black">
                      {selectedWorkout.memberName} • {selectedWorkout.durationWeeks || Math.ceil(Object.keys(selectedWorkout.days || {}).length / 7) || 1} Weeks
                    </p>
                  </div>

                  {/* WEEK SELECTOR */}
                  <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 h-fit">
                    {Array.from(
                      { length: selectedWorkout.durationWeeks || Math.ceil(Object.keys(selectedWorkout.days || {}).length / 7) || 1 },
                      (_, i) => i + 1
                    ).map((week) => (
                      <button
                        key={week}
                        onClick={() => setSelectedWeek(week)}
                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all duration-300
                          ${selectedWeek === week
                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                            : "text-gray-500 hover:bg-white/5 hover:text-white"
                          }
                        `}
                      >
                        Week {week}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedWorkout(null)}
                  className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all duration-300 w-fit"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto rounded-2xl border border-white/5 custom-scrollbar">
                <div className="min-w-[1100px]">

                {/* TABLE HEADER */}
                {/* Desktop grid view */}
                <div className="hidden sm:block">
                  <div className="grid grid-cols-8 bg-white/5 border-b border-white/10 text-center sticky top-0 z-10 backdrop-blur-xl">
                    <div className="p-5 border-r border-white/10 text-xs font-black uppercase tracking-widest text-gray-400">TIME</div>
                    {weekDays.map((day) => (
                      <div key={day} className="p-5 border-r border-white/10 text-xs font-black uppercase tracking-widest text-orange-500">
                        {day}
                      </div>
                    ))}
                  </div>                  {/* TABLE BODY */}
                  {dynamicTimeSlots.map((time) => (
                    <div
                      key={time}
                      className="grid grid-cols-8 border-b border-white/5 text-center hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="p-6 border-r border-white/5 font-bold text-xs text-gray-500 bg-white/[0.02]">
                        {time}
                      </div>

                      {weekDays.map((dayName, dayIndex) => {
                        const dayOffset = (selectedWeek - 1) * 7;
                        const dayKey = `Day${dayOffset + dayIndex + 1}`;

                        const allDayExercises =
                          selectedWorkout.weeks?.[`Week${selectedWeek}`]?.[dayKey] ||
                          selectedWorkout.days?.[dayKey] || [];
                        
                        // Only show exercises that match THIS time slot
                        const exercises = allDayExercises.filter(ex => (ex.time === time) || (!ex.time && dynamicTimeSlots.indexOf(time) === 0));

                        return (
                          <div
                            key={dayName}
                            className="p-3 border-r border-white/5 flex items-start justify-center min-h-[120px]"
                          >
                            {exercises.length > 0 ? (
                              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/30 rounded-2xl p-4 w-full shadow-lg">
                                <ul className="text-xs text-left space-y-3">
                                  {exercises.map((ex, i) => (
                                    <li key={i} className="flex flex-col group">
                                      <div className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                                        <span className="font-bold text-white uppercase tracking-tight leading-tight group-hover:text-orange-400 transition-colors">
                                          {typeof ex === 'object' ? (ex.name || 'No Name') : ex}
                                        </span>
                                      </div>
                                      {typeof ex === 'object' && (
                                        <div className="flex flex-wrap gap-x-2 gap-y-1 ml-3.5 mt-1 text-[9px] font-bold text-gray-500 uppercase tracking-tighter">
                                          {ex.sets && <span className="bg-white/5 px-1.5 py-0.5 rounded">{ex.sets} Sets</span>}
                                          {ex.count && <span className="bg-white/5 px-1.5 py-0.5 rounded">{ex.count}</span>}
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <div className="mt-4 w-6 h-0.5 bg-white/10 rounded-full" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

                {/* Mobile stacked view: show each day as a vertical section with time slots */}
                <div className="sm:hidden space-y-4 p-2">
                  {weekDays.map((dayName, dayIndex) => {
                    const dayOffset = (selectedWeek - 1) * 7;
                    const dayKey = `Day${dayOffset + dayIndex + 1}`;

                    const allDayExercises =
                      selectedWorkout.weeks?.[`Week${selectedWeek}`]?.[dayKey] ||
                      selectedWorkout.days?.[dayKey] || [];

                    return (
                      <div key={dayName} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-semibold">{dayName}</div>
                        </div>

                        <div className="space-y-2">
                          {dynamicTimeSlots.map((time, idx) => {
                            const exercises = allDayExercises.filter(ex => (ex.time === time) || (!ex.time && dynamicTimeSlots.indexOf(time) === 0));
                            if (exercises.length === 0) return null;

                            return (
                              <div key={idx} className="p-2 bg-white/5 rounded">
                                <div className="text-xs text-gray-300 font-medium">{time}</div>
                                <ul className="text-xs text-gray-200 mt-1 space-y-1">
                                  {exercises.map((ex, i) => (
                                    <li key={i} className="flex flex-col mb-1 last:mb-0 border-b border-white/5 pb-1">
                                      <span className="font-bold text-orange-400">
                                        • {typeof ex === 'object' ? (ex.name || 'No Name') : ex}
                                      </span>
                                      {typeof ex === 'object' && (
                                        <span className="text-gray-400 ml-3 text-[10px]">
                                          {ex.sets && `${ex.sets} Sets`} {ex.count && `• ${ex.count}`}
                                        </span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
              </>
              );
              })()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AllWorkouts;

