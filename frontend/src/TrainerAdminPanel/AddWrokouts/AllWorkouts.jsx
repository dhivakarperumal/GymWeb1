import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Edit2, Eye, Trash2, X, Plus, LayoutGrid, List } from "lucide-react";
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
  const [levelFilter, setLevelFilter] = useState("");
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'
  const navigate = useNavigate();

  const filteredWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      if (!w) return false;
      const matchesSearch = `${w.memberName || ''} ${w.goal || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesLevel = levelFilter ? w.level === levelFilter : true;

      return matchesSearch && matchesLevel;
    });
  }, [workouts, search, levelFilter]);

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
        {/* HEADER */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
            <div className="relative w-full md:w-64">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search member or goal..."
                className="w-full pl-4 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="w-full md:w-44 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm cursor-pointer"
              >
                <option value="">All Levels</option>
                {[...new Set(workouts.map(w => w.level).filter(Boolean))].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 h-fit">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2.5 rounded-xl transition-all ${viewMode === "table" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-gray-500 hover:text-white"
                  }`}
                title="Table View"
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode("card")}
                className={`p-2.5 rounded-xl transition-all ${viewMode === "card" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-gray-500 hover:text-white"
                  }`}
                title="Card View"
              >
                <LayoutGrid size={20} />
              </button>
            </div>

            <button
              onClick={() => navigate('/trainer/addworkouts')}
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
              <thead className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-widest font-black">
                <tr>
                  <th className="px-6 py-5 border-b border-white/5">S No</th>
                  <th className="px-6 py-5 border-b border-white/5">Member</th>
                  <th className="px-6 py-5 border-b border-white/5 text-orange-500">Level</th>
                  <th className="px-6 py-5 border-b border-white/5">Duration</th>
                  <th className="px-6 py-5 border-b border-white/5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredWorkouts.map((w, i) => (
                  <tr key={w.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5 text-gray-500 font-mono">{(i + 1).toString().padStart(2, '0')}</td>
                    <td className="px-6 py-5 font-bold text-white uppercase tracking-tight">{w.memberName}</td>
                    <td className="px-6 py-5">
                      <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-orange-500/20">
                        {w.level}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-gray-400 font-medium">
                      {w.durationWeeks} Weeks
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() => { setSelectedWorkout(w); setSelectedWeek(1); }}
                          className="p-2.5 rounded-xl bg-white/5 text-orange-400 hover:bg-orange-500 hover:text-white transition-all shadow-lg"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/trainer/addworkouts/${w.id}`)}
                          className="p-2.5 rounded-xl bg-white/5 text-blue-400 hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(w.id)}
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
            {filteredWorkouts.map((w, i) => (
              <div key={w.id} className="group relative bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-orange-500/50 transition-all duration-500 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 p-8 bg-orange-500/10 rounded-bl-[100px] -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-all" />

                <div className="flex justify-between items-start mb-6">
                  <div className="bg-orange-500/20 p-4 rounded-2xl text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <Eye size={24} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">
                      #{(i + 1).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-orange-400 transition-colors">
                      {w.memberName}
                    </h4>
                    <p className="text-gray-400 text-sm font-medium mt-1">Workout Program</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Level</p>
                      <p className="text-orange-400 font-black uppercase text-[10px]">{w.level}</p>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-2xl p-3 border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Duration</p>
                      <p className="text-white font-black">{w.durationWeeks} Weeks</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => { setSelectedWorkout(w); setSelectedWeek(1); }}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg shadow-orange-500/20"
                    >
                      View Schedule
                    </button>
                    <button
                      onClick={() => navigate(`/trainer/addworkouts/${w.id}`)}
                      className="p-3 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all border border-white/5"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
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

        {/* VIEW MODAL (selectedWorkout) */}
        {selectedWorkout && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={() => setSelectedWorkout(null)}>
            <div
              className="bg-gray-950/90 border border-white/10 w-full max-w-7xl rounded-3xl p-5 md:p-7 overflow-hidden shadow-2xl backdrop-blur-2xl flex flex-col max-h-[95vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const dynamicTimeSlots = [...new Set(
                  Object.values(selectedWorkout.weeks?.[`Week${selectedWeek}`] || selectedWorkout.days || {})
                    .flatMap(day => Array.isArray(day) ? day.map(ex => ex.time) : [])
                    .filter(Boolean)
                )].sort();

                if (dynamicTimeSlots.length === 0) dynamicTimeSlots.push("Morning", "Afternoon", "Evening");

                return (
                  <>
                    {/* MODAL HEADER */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div>
                          <h3 className="text-2xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)] animate-pulse" />
                            Workout Timetable
                          </h3>
                          <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-widest font-black flex items-center gap-3">
                            <span>{selectedWorkout.memberName}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-orange-400">{selectedWorkout.level}</span>
                          </p>
                        </div>

                        {/* WEEK SELECTOR */}
                        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 h-fit">
                          {Array.from({ length: selectedWorkout.durationWeeks }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedWeek(i + 1)}
                              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${selectedWeek === i + 1
                                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                  : "text-gray-500 hover:bg-white/5 hover:text-white"
                                }`}
                            >
                              Week {i + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedWorkout(null)}
                        className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all duration-300 w-fit self-end md:self-auto"
                      >
                        <span className="text-xl leading-none">&times;</span>
                      </button>
                    </div>

                    {/* TIMETABLE CONTENT */}
                    <div className="flex-1 overflow-auto rounded-2xl border border-white/5 custom-scrollbar">
                      <div className="min-w-[1200px]">
                        {/* Desktop View */}
                        <div className="hidden sm:block">
                          <div className={`grid bg-white/5 border-b border-white/10 text-center sticky top-0 z-20 backdrop-blur-xl`} style={{ gridTemplateColumns: `120px repeat(${dynamicTimeSlots.length}, minmax(200px, 1fr))` }}>
                            <div className="p-5 border-r border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-950/50">DAY / TIME</div>
                            {dynamicTimeSlots.map((time) => (
                              <div key={time} className="p-5 border-r border-white/10 text-[10px] font-black uppercase tracking-widest text-orange-500">
                                {time}
                              </div>
                            ))}
                          </div>

                          {weekDays.map((dayName, dayIndex) => {
                            const dayOffset = (selectedWeek - 1) * 7;
                            const dayKey = `Day${dayOffset + dayIndex + 1}`;
                            const allDayExercises = selectedWorkout.weeks?.[`Week${selectedWeek}`]?.[dayKey] || selectedWorkout.days?.[dayKey] || [];

                            return (
                              <div key={dayName} className="grid border-b border-white/5 hover:bg-white/[0.02] transition-colors" style={{ gridTemplateColumns: `120px repeat(${dynamicTimeSlots.length}, minmax(200px, 1fr))` }}>
                                <div className="p-6 border-r border-white/5 font-bold text-[10px] uppercase tracking-widest text-orange-400/80 bg-white/[0.02] flex items-center justify-center sticky left-0 z-10 backdrop-blur-md">
                                  {dayName}
                                </div>
                                {dynamicTimeSlots.map((time) => {
                                  const exercises = allDayExercises.filter(ex => (ex.time === time) || (!ex.time && dynamicTimeSlots.indexOf(time) === 0));
                                  return (
                                    <div key={time} className="p-3 border-r border-white/5 min-h-[140px] flex items-start justify-center">
                                      {exercises.length > 0 ? (
                                        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/5 border border-orange-500/20 rounded-2xl p-4 w-full shadow-lg group hover:border-orange-500/40 transition-all">
                                          <ul className="text-[10px] text-left space-y-2">
                                            {exercises.map((ex, i) => (
                                              <li key={i} className="flex flex-col border-b border-white/5 last:border-0 pb-1.5 last:pb-0">
                                                <span className="font-bold text-white leading-tight group-hover:text-orange-400 transition-colors">
                                                  {typeof ex === 'object' ? ex.name : ex}
                                                </span>
                                                {typeof ex === 'object' && (ex.sets || ex.count) && (
                                                  <span className="text-gray-500 text-[9px] font-medium mt-0.5 uppercase">
                                                    {ex.sets && `${ex.sets} Sets`} {ex.count && `• ${ex.count}`}
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

                        {/* Mobile View */}
                        <div className="sm:hidden space-y-4 p-4">
                          {weekDays.map((dayName, dayIndex) => {
                            const dayOffset = (selectedWeek - 1) * 7;
                            const dayKey = `Day${dayOffset + dayIndex + 1}`;
                            const allDayExercises = selectedWorkout.weeks?.[`Week${selectedWeek}`]?.[dayKey] || selectedWorkout.days?.[dayKey] || [];

                            return (
                              <div key={dayName} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="text-xs font-black uppercase tracking-widest text-orange-500 mb-4">{dayName}</div>
                                <div className="space-y-4">
                                  {dynamicTimeSlots.map((time) => {
                                    const exercises = allDayExercises.filter(ex => (ex.time === time));
                                    if (exercises.length === 0) return null;
                                    return (
                                      <div key={time} className="space-y-2 border-l-2 border-orange-500/30 pl-3">
                                        <div className="text-[10px] font-bold text-gray-500">{time}</div>
                                        {exercises.map((ex, i) => (
                                          <div key={i} className="text-xs">
                                            <div className="text-white font-bold">{typeof ex === 'object' ? ex.name : ex}</div>
                                            {typeof ex === 'object' && <div className="text-gray-500 text-[10px]">{ex.sets} Sets • {ex.count}</div>}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
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

