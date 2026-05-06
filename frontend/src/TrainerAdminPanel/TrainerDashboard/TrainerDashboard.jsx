/* Trainer Dashboard (simplified) */
import React, { useEffect, useState } from "react";
import {
  FaUsers,
  FaDumbbell,
  FaClipboardList,
  FaCalendarCheck,
  FaEye,
  FaPencilAlt,
  FaTimes,
  FaPrint
} from "react-icons/fa";
import { BarChart3, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import PTFormPreviewContent from "../../Admin/PTForm/PTFormPreviewContent";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from "recharts";

import api from "../../api";

/* -------------------- STAT CARD -------------------- */
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 flex justify-between items-center">
    <div>
      <p className="text-xs uppercase tracking-widest text-gray-300">
        {title}
      </p>
      <h2 className="text-3xl font-bold text-white mt-2">{value !== undefined ? value : 0}</h2>
    </div>

    <div
      className={`p-4 rounded-xl bg-gradient-to-br ${color} text-white text-2xl`}
    >
      {icon}
    </div>
  </div>
);

/* -------------------- TRAINER DASHBOARD -------------------- */
const TrainerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const trainerId = user?.id;

  const [loading, setLoading] = useState(true);
  const [assignedMembers, setAssignedMembers] = useState([]);

  const [stats, setStats] = useState({
    members: 0,
    todayCheckins: 0,
    workoutPlans: 0,
    dietPlans: 0,
  });

  const [ptViewMember, setPtViewMember] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  /* ---------------- LOAD DASHBOARD DATA ---------------- */
  useEffect(() => {
    if (!trainerId || !user) return;

    const loadDashboard = async () => {
      try {
        setLoading(true);

        /* FETCH ASSIGNMENTS — server filters by this trainer's user ID */
        const memberRes = await api.get(`/assignments?trainerUserId=${trainerId}`);
        const membersRaw = Array.isArray(memberRes.data)
          ? memberRes.data
          : memberRes.data?.data || memberRes.data?.assignments || [];

        console.log("📊 Assignments from server:", membersRaw.length);

        /* show only ACTIVE members */
        const activeMembers = membersRaw.filter(
          (m) => !m.status || (m.status || "").toLowerCase() === "active"
        );

        /* remove duplicates — use gymMemberId as primary key, fall back to userId */
        const seen = new Set();
        const uniqueMembers = activeMembers.filter((m) => {
          const key = String(m.gymMemberId || m.gym_member_id || m.userId || m.user_id || m.id || "");
          if (!key || key === "undefined" || seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        setAssignedMembers(uniqueMembers);

        const assignedMemberIds = uniqueMembers.map(m => String(m.gymMemberId)).filter(id => id && id !== "null");
        const assignedUserIds = uniqueMembers.map(m => String(m.userId || m.user_id)).filter(id => id && id !== "null");

        // Combine both to ensure we catch plans saved under either ID type
        const allAssociatedIds = [...new Set([...assignedMemberIds, ...assignedUserIds])];

        console.log("👥 Assigned IDs (Combined):", allAssociatedIds.length);

        let workoutCount = 0;
        let dietCount = 0;
        let checkinCount = 0;

        try {
          /* WORKOUT PLANS for this trainer specifically */
          const workoutRes = await api.get(`/workouts?trainerId=${trainerId}`);
          const workoutData = workoutRes.data;
          const workoutsRaw = Array.isArray(workoutData) ? workoutData : workoutData?.data || [];

          // Filter against any possible associated ID (gymMemberId or userId)
          const userWorkouts = allAssociatedIds.length > 0
            ? workoutsRaw.filter(w => allAssociatedIds.includes(String(w.member_id || w.memberId || w.user_id || w.userId)))
            : [];
          workoutCount = userWorkouts.length;
          console.log("💪 Workouts:", workoutCount);
        } catch (e) {
          console.error("Workout fetch error:", e);
        }

        try {
          /* DIET PLANS for this trainer specifically */
          const dietRes = await api.get(`/diet-plans?trainerId=${trainerId}`);
          const dietData = dietRes.data;
          const dietsRaw = Array.isArray(dietData) ? dietData : dietData?.data || [];

          // Filter against any possible associated ID (gymMemberId or userId)
          const userDiets = allAssociatedIds.length > 0
            ? dietsRaw.filter(d => allAssociatedIds.includes(String(d.member_id || d.memberId || d.user_id || d.userId)))
            : [];
          dietCount = userDiets.length;
          console.log("🥗 Diets:", dietCount);
        } catch (e) {
          console.error("Diet fetch error:", e);
        }

        try {
          /* TODAY CHECKINS */
          const checkinRes = await api.get(`/checkins/today?trainerId=${trainerId}`);
          checkinCount = checkinRes.data?.count || checkinRes.data?.length || 0;
          console.log("📅 Checkins:", checkinCount);
        } catch (e) {
          console.error("Checkin fetch error:", e);
        }

        setStats({
          members: uniqueMembers.length,
          todayCheckins: checkinCount,
          workoutPlans: workoutCount,
          dietPlans: dietCount,
        });

      } catch (err) {
        console.error("Dashboard error:", err);
        setStats({ members: 0, todayCheckins: 0, workoutPlans: 0, dietPlans: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [trainerId, user]);

  /* ---------------- LOADING ---------------- */

  const totalPages = Math.ceil(assignedMembers.length / itemsPerPage);
  const paginatedMembers = assignedMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <StatCard
            title="Assigned Members"
            value={stats.members}
            icon={<FaUsers />}
            color="from-blue-500 to-cyan-500"
          />

          <StatCard
            title="Today's Check-ins"
            value={stats.todayCheckins}
            icon={<FaCalendarCheck />}
            color="from-emerald-500 to-teal-500"
          />

          <StatCard
            title="Workout Plans"
            value={stats.workoutPlans}
            icon={<FaDumbbell />}
            color="from-purple-500 to-pink-500"
          />

          <StatCard
            title="Diet Plans"
            value={stats.dietPlans}
            icon={<FaClipboardList />}
            color="from-orange-500 to-amber-500"
          />

        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* BAR CHART: Activity Overview */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Activity Overview</h3>
              <div className="p-2 bg-white/5 rounded-lg border border-white/10"><BarChart3 size={16} className="text-orange-400" /></div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Workouts", count: stats.workoutPlans, fill: "#a855f7" },
                  { name: "Diets", count: stats.dietPlans, fill: "#f97316" },
                  { name: "Check-ins", count: stats.todayCheckins, fill: "#10b981" }
                ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWorkout" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorDiet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorCheckin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} dx={-10} />
                  <RechartsTooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                    contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={40} label={{
                    position: "top",
                    fill: "#fff",
                    fontSize: 14,
                    fontWeight: "bold"
                  }}>
                    {
                      [
                        { name: "Workouts", fill: "url(#colorWorkout)" },
                        { name: "Diets", fill: "url(#colorDiet)" },
                        { name: "Check-ins", fill: "url(#colorCheckin)" }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PIE CHART: PT Form Completion */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full" />
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/50">PT Form Status</h3>
              <div className="p-2 bg-white/5 rounded-lg border border-white/10"><Activity size={16} className="text-blue-400" /></div>
            </div>

            <div className="h-64 relative">
              {/* Inner Label for Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4">
                <span className="text-3xl font-black text-white">{assignedMembers.length}</span>
                <span className="text-[9px] uppercase tracking-widest text-white/40">Total</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Completed", value: assignedMembers.filter(m => m.ptFormCompleted).length },
                      { name: "Pending", value: assignedMembers.filter(m => !m.ptFormCompleted).length }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={10}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ASSIGNED MEMBERS TABLE */}
        <div>
          <h3 className="text-sm uppercase tracking-widest text-gray-300 mb-4">
            Assigned Members
          </h3>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden">

            {/* DESKTOP TABLE */}
            <div className="hidden sm:block overflow-x-auto custom-scrollbar">
              <table className="min-w-[640px] w-full text-base text-gray-200">

                <thead className="bg-white/20">
                  <tr>
                    <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">S No</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Member</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Email</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Mobile</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Plan</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Start Date</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">End Date</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">PT Form</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {assignedMembers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-6 text-base text-gray-400">
                        No members assigned
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((m, ind) => (
                      <tr
                        key={m.id || ind}
                        className="border-b border-white/10 hover:bg-white/5"
                      >

                        <td className="px-4 py-4 text-base">{(currentPage - 1) * itemsPerPage + ind + 1}</td>

                        <td className="px-4 py-4 text-base font-medium">
                          {m.username || m.user_name || "No Name"}
                        </td>

                        <td className="px-4 py-4 text-base">
                          {m.userEmail || m.user_email || "-"}
                        </td>

                        <td className="px-4 py-4 text-base">
                          {m.userMobile || m.user_mobile || "-"}
                        </td>

                        <td className="px-4 py-4 text-base">
                          <span className="text-orange-400 font-medium">
                            {m.planName || m.plan_name || "-"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-base text-gray-400">
                          {m.planStartDate ? new Date(m.planStartDate).toLocaleDateString() : "-"}
                        </td>

                        <td className="px-4 py-4 text-base text-gray-400">
                          {m.planEndDate ? new Date(m.planEndDate).toLocaleDateString() : "-"}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/trainer/pt-form?member_id=${m.gymMemberId}`)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${m.ptFormCompleted
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                                }`}
                            >
                              {m.ptFormCompleted ? "Completed" : "Pending"}
                            </button>

                            {m.ptFormCompleted ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setPtViewMember(m)}
                                  className="p-1.5 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-all"
                                  title="View PT Form"
                                >
                                  <FaEye size={12} />
                                </button>
                                <button
                                  onClick={() => navigate(`/trainer/pt-form?member_id=${m.gymMemberId}`)}
                                  className="p-1.5 text-orange-400 hover:bg-orange-400/20 rounded-lg transition-all"
                                  title="Edit PT Form"
                                >
                                  <FaPencilAlt size={12} />
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                            {m.status || "Active"}
                          </span>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>

              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="sm:hidden space-y-3 p-3">

              {assignedMembers.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  No members assigned
                </div>
              ) : (
                paginatedMembers.map((m, ind) => (

                  <div
                    key={m.id || ind}
                    className="bg-white/5 border border-white/10 rounded-lg p-4"
                  >

                    <div className="flex justify-between items-start">

                      <div>
                        <p className="font-semibold">
                          {m.username || m.user_name || "No Name"}
                        </p>

                        <p className="text-xs text-gray-400">
                          {m.userEmail || m.user_email || "-"}
                        </p>

                        <p className="text-xs text-gray-400">
                          {m.userMobile || m.user_mobile || "-"}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          Plan: <span className="text-orange-400">{m.planName || m.plan_name || "-"}</span>
                        </p>

                        <div className="flex gap-4 mt-2">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase">Starts</p>
                            <p className="text-[11px] text-gray-300">{m.planStartDate ? new Date(m.planStartDate).toLocaleDateString() : "-"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase">Ends</p>
                            <p className="text-[11px] text-gray-300">{m.planEndDate ? new Date(m.planEndDate).toLocaleDateString() : "-"}</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <button
                            onClick={() => navigate(`/trainer/pt-form?member_id=${m.gymMemberId}`)}
                            className={`w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${m.ptFormCompleted
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}
                          >
                            PT Form: {m.ptFormCompleted ? "Completed" : "Pending"}
                          </button>
                        </div>
                      </div>

                      <div className="text-right">

                        <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
                          {m.status || "Active"}
                        </span>

                        <div className="text-xs text-gray-400 mt-2">
                          #{(currentPage - 1) * itemsPerPage + ind + 1}
                        </div>

                      </div>

                    </div>

                  </div>

                ))
              )}

            </div>

          </div>

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 px-2">
              <span className="text-xs text-gray-400 uppercase tracking-widest">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, assignedMembers.length)} of {assignedMembers.length} entries
              </span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 hover:bg-white/10"
                >
                  Prev
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                        : "hover:bg-white/10 text-white/60"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 hover:bg-white/10"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* PT FORM MODAL */}
      {ptViewMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#1a1a1a] w-full max-w-5xl h-[90vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                  <FaClipboardList size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {ptViewMember.username || ptViewMember.user_name}'s PT Assessment
                  </h2>
                  <p className="text-xs text-white/40 uppercase tracking-widest">Digital Health & Fitness Record</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/trainer/pt-form?member_id=${ptViewMember.gymMemberId}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl text-sm font-bold hover:bg-orange-500 hover:text-white transition-all"
                >
                  <FaPencilAlt size={14} /> Edit Form
                </button>
                <button
                  onClick={() => setPtViewMember(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
                >
                  <FaTimes size={24} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white/5">
              <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 shadow-2xl">
                <PTFormPreviewContent memberId={ptViewMember.gymMemberId} hideControls={true} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerDashboard;