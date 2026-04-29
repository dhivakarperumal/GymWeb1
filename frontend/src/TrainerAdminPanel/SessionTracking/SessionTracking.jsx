import React, { useState, useEffect } from "react";
import { Plus, Search, Calendar, Clock, Activity, Trash2, X, CheckCircle2, Dumbbell, Minus } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";

const SessionTracking = () => {
    const { user } = useAuth();
    const trainerId = user?.id;

    const [sessions, setSessions] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const [form, setForm] = useState({
        memberId: "",
        memberName: "",
        sessionDate: new Date().toISOString().split('T')[0],
        startTime: "",
        endTime: "",
        sessionType: "Personal Training",
        workouts: [""],
        notes: ""
    });

    const sessionTypes = [
        "Bodybuilding",
        "Cardio",
        "Circuit Training",
        "CrossFit",
        "Endurance",
        "Group Class",
        "HIIT",
        "Kickboxing",
        "Mobility",
        "Personal Training",
        "Pilates",
        "Powerlifting",
        "Strength Training",
        "Stretching",
        "Yoga",
        "Zumba"
    ].sort();

    useEffect(() => {
        if (trainerId) {
            fetchSessions();
            fetchAssignedMembers();
        }
    }, [trainerId]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/sessions?trainerUserId=${trainerId}`);
            setSessions(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load sessions");
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignedMembers = async () => {
        try {
            const res = await api.get(`/assignments?trainerUserId=${trainerId}`);
            const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
            setMembers(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddWorkout = () => {
        setForm({ ...form, workouts: [...form.workouts, ""] });
    };

    const handleRemoveWorkout = (index) => {
        const updatedWorkouts = form.workouts.filter((_, i) => i !== index);
        setForm({ ...form, workouts: updatedWorkouts.length > 0 ? updatedWorkouts : [""] });
    };

    const handleWorkoutChange = (index, value) => {
        const updatedWorkouts = [...form.workouts];
        updatedWorkouts[index] = value;
        setForm({ ...form, workouts: updatedWorkouts });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.memberId) return toast.error("Please select a member");
        
        // Filter out empty workouts
        const cleanWorkouts = form.workouts.filter(w => w.trim() !== "");
        if (cleanWorkouts.length === 0) return toast.error("Please add at least one workout");

        setSubmitting(true);
        try {
            const payload = {
                ...form,
                workouts: cleanWorkouts,
                trainerUserId: trainerId
            };
            await api.post('/sessions', payload);
            toast.success("Session added successfully!");
            setShowModal(false);
            fetchSessions();
            setForm({
                memberId: "",
                memberName: "",
                sessionDate: new Date().toISOString().split('T')[0],
                startTime: "",
                endTime: "",
                sessionType: "Personal Training",
                workouts: [""],
                notes: ""
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to add session");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this session?")) return;
        try {
            await api.delete(`/sessions/${id}`);
            toast.success("Session deleted");
            fetchSessions();
        } catch (err) {
            console.error(err);
            toast.error("Delete failed");
        }
    };

    const filteredSessions = sessions.filter(s => 
        s.member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.session_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen p-4 lg:p-8 text-white bg-black/5">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                            Session Tracking
                        </h1>
                        <p className="text-white/40 text-sm mt-1">Manage and track your member workout sessions</p>
                    </div>
                    
                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all w-full md:w-auto"
                    >
                        <Plus size={20} />
                        Add New Session
                    </button>
                </div>

                {/* Filters & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-3 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                        <input 
                            type="text" 
                            placeholder="Search by member or session type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                        />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest text-white/40">Total Sessions</p>
                            <h3 className="text-2xl font-bold">{sessions.length}</h3>
                        </div>
                        <div className="p-3 bg-orange-500/20 rounded-xl text-orange-500">
                            <Activity size={24} />
                        </div>
                    </div>
                </div>

                {/* Sessions Table/Grid */}
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40 border-b border-white/10">
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Member</th>
                                    <th className="px-6 py-4 font-semibold">Type</th>
                                    <th className="px-6 py-4 font-semibold">Duration</th>
                                    <th className="px-6 py-4 font-semibold">Workouts</th>
                                    <th className="px-6 py-4 font-semibold">Notes</th>
                                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-white/40 animate-pulse">Loading sessions...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-2 text-white/20">
                                                <Activity size={48} />
                                                <p>No sessions found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSessions.map((session) => {
                                        let workoutList = [];
                                        try {
                                            workoutList = typeof session.workouts === 'string' ? JSON.parse(session.workouts) : session.workouts || [];
                                        } catch (e) { workoutList = []; }

                                        return (
                                            <tr key={session.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                                            <Calendar size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{new Date(session.session_date).toLocaleDateString()}</p>
                                                            <p className="text-[10px] text-white/40">Created {new Date(session.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="font-semibold text-orange-400">{session.member_name}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase border border-white/10">
                                                        {session.session_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 text-white/60">
                                                        <Clock size={14} />
                                                        <span className="text-xs">{session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {workoutList.map((w, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[10px] border border-orange-500/20">
                                                                {w}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 max-w-xs">
                                                    <p className="text-xs text-white/40 truncate" title={session.notes}>
                                                        {session.notes || "No notes"}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button 
                                                        onClick={() => handleDelete(session.id)}
                                                        className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Add Session Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div 
                        className="bg-[#1a1a1a] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <h2 className="text-xl font-bold">Record New Session</h2>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Member Selection */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Select Member</label>
                                    <select 
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        value={form.memberId}
                                        onChange={(e) => {
                                            const member = members.find(m => String(m.userId || m.user_id) === e.target.value);
                                            setForm({ ...form, memberId: e.target.value, memberName: member?.username || member?.user_name || "" });
                                        }}
                                    >
                                        <option value="" className="bg-[#1a1a1a]">-- Select Member --</option>
                                        {members.map(m => (
                                            <option key={m.userId || m.user_id} value={m.userId || m.user_id} className="bg-[#1a1a1a]">
                                                {m.username || m.user_name} ({m.planName})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Date */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Session Date</label>
                                    <input 
                                        type="date" 
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        value={form.sessionDate}
                                        onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
                                    />
                                </div>

                                {/* Session Type */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Session Type</label>
                                    <select 
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        value={form.sessionType}
                                        onChange={(e) => setForm({ ...form, sessionType: e.target.value })}
                                    >
                                        {sessionTypes.map(t => <option key={t} value={t} className="bg-[#1a1a1a]">{t}</option>)}
                                    </select>
                                </div>

                                {/* Times */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Start Time</label>
                                    <input 
                                        type="time" 
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        value={form.startTime}
                                        onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">End Time</label>
                                    <input 
                                        type="time" 
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                        value={form.endTime}
                                        onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                    />
                                </div>

                                {/* Workouts (Multiple) */}
                                <div className="space-y-4 md:col-span-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                            <Dumbbell size={14} className="text-orange-500" />
                                            Workouts Performed
                                        </label>
                                        <button 
                                            type="button"
                                            onClick={handleAddWorkout}
                                            className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline"
                                        >
                                            + Add Workout
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {form.workouts.map((workout, index) => (
                                            <div key={index} className="relative group">
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. Bench Press, Squats..."
                                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                                                    value={workout}
                                                    onChange={(e) => handleWorkoutChange(index, e.target.value)}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => handleRemoveWorkout(index)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Session Notes / Performance</label>
                                    <textarea 
                                        placeholder="Enter details about the session..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500 transition-all min-h-[100px]"
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className={`w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-bold shadow-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {submitting ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={20} />
                                            Save Session Record
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionTracking;
