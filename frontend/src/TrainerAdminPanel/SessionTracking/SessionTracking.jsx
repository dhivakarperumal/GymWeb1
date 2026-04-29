import React, { useState, useEffect } from "react";
import { Plus, Search, Calendar, Clock, Activity, Trash2, X, CheckCircle2, Dumbbell, Minus } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../PrivateRouter/AuthContext";
import api from "../../api";
import DateRangeFilter from "../../Admin/DateRangeFilter";
import { filterByDateRange } from "../../Admin/utils/dateUtils";
import dayjs from "dayjs";

const TimeSelect = ({ label, value, onChange }) => {
    // value is "HH:mm" (24h)
    const timeVal = value || "12:00";
    const [h, m] = timeVal.split(':');
    let hour24 = parseInt(h);
    const ampm = hour24 >= 12 ? "PM" : "AM";
    const displayHour = hour24 % 12 || 12;

    const updateTime = (newH24, newM) => {
        onChange(`${String(newH24).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">{label}</label>
            <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 focus-within:border-orange-500/50 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all hover:bg-white/10">
                <select 
                    className="flex-1 bg-transparent border-none px-2 py-2 text-white outline-none cursor-pointer text-center text-sm font-bold appearance-none"
                    value={displayHour}
                    onChange={(e) => {
                        let h24 = parseInt(e.target.value);
                        if (ampm === "PM" && h24 < 12) h24 += 12;
                        if (ampm === "AM" && h24 === 12) h24 = 0;
                        updateTime(h24, m);
                    }}
                >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(hr => (
                        <option key={hr} value={hr} className="bg-[#1a1a1a]">{hr}</option>
                    ))}
                </select>
                
                <span className="text-white/20 font-black">:</span>

                <select 
                    className="flex-1 bg-transparent border-none px-2 py-2 text-white outline-none cursor-pointer text-center text-sm font-bold appearance-none"
                    value={parseInt(m)}
                    onChange={(e) => updateTime(hour24, e.target.value)}
                >
                    {Array.from({ length: 12 }, (_, i) => i * 5).map(min => (
                        <option key={min} value={min} className="bg-[#1a1a1a]">{String(min).padStart(2, '0')}</option>
                    ))}
                </select>

                <div className="w-px h-6 bg-white/10 mx-1"></div>

                <select 
                    className="flex-1 bg-transparent border-none px-2 py-2 text-orange-500 outline-none cursor-pointer text-center text-[10px] font-black uppercase tracking-wider appearance-none"
                    value={ampm}
                    onChange={(e) => {
                        const newAmpm = e.target.value;
                        let h24 = displayHour;
                        if (newAmpm === "PM" && h24 < 12) h24 += 12;
                        if (newAmpm === "AM" && h24 === 12) h24 = 0;
                        updateTime(h24, m);
                    }}
                >
                    <option value="AM" className="bg-[#1a1a1a]">AM</option>
                    <option value="PM" className="bg-[#1a1a1a]">PM</option>
                </select>
            </div>
        </div>
    );
};

const SessionTracking = () => {
    const { user } = useAuth();
    const trainerId = user?.id;

    const [sessions, setSessions] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [viewMode, setViewMode] = useState('table');
    const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });

    const [form, setForm] = useState({
        memberId: "",
        memberName: "",
        sessionDate: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "10:00",
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
                startTime: "09:00",
                endTime: "10:00",
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

    const formatTo12Hour = (time) => {
        if (!time) return "--:--";
        const [hours, minutes] = time.split(':');
        let h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${minutes} ${ampm}`;
    };

    const filteredSessions = sessions.filter(s => {
        const matchesSearch = s.member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             s.session_type?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;
        
        return filterByDateRange([s], 'session_date', dateRange.type, dateRange.range).length > 0;
    });

    return (
        <div className="min-h-screen p-4 lg:p-8 text-white bg-black/5">
            <div className="max-w-7xl mx-auto space-y-6">
                
              
                {/* Filters & Stats */}
                <div className="flex flex-col lg:flex-row gap-4 items-center pb-5 justify-between  p-0 rounded-2xl ">
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search sessions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
                        />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />
                        
                        {/* View Toggle */}
                        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white'}`}
                                title="Table View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('card')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white'}`}
                                title="Card View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                </svg>
                            </button>
                        </div>

                        <div className="h-8 w-px bg-white/10 mx-1 hidden lg:block"></div>

                        <button 
                            onClick={() => setShowModal(true)}
                            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all text-sm whitespace-nowrap"
                        >
                            <Plus size={18} />
                            Add Session
                        </button>
                    </div>
                </div>

                {/* Sessions Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white/40 animate-pulse">Loading sessions...</p>
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/20 bg-white/5 rounded-3xl border border-white/10">
                        <Activity size={48} strokeWidth={1} />
                        <p className="text-sm font-medium">No sessions found</p>
                    </div>
                ) : viewMode === 'card' ? (
                    /* CARD VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
                        {filteredSessions.map((session) => {
                            let workoutList = [];
                            try {
                                workoutList = typeof session.workouts === 'string' ? JSON.parse(session.workouts) : session.workouts || [];
                            } catch (e) { workoutList = []; }

                            return (
                                <div key={session.id} className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-orange-500/40 hover:bg-white/10 transition-all flex flex-col gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold">{new Date(session.session_date).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-white/40 uppercase tracking-widest">{formatTo12Hour(session.start_time)}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(session.id)}
                                            className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div>
                                        <h4 className="text-orange-400 font-black text-lg">{session.member_name}</h4>
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-black uppercase tracking-widest border border-white/10 text-white/60">
                                            {session.session_type}
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-1">
                                            {workoutList.map((w, idx) => (
                                                <span key={idx} className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[10px] border border-orange-500/20 font-bold">
                                                    {w}
                                                </span>
                                            ))}
                                        </div>
                                        {session.notes && (
                                            <p className="text-[11px] text-white/40 line-clamp-2 italic">
                                                "{session.notes}"
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-white/30 text-[10px] font-bold">
                                            <Clock size={12} />
                                            {formatTo12Hour(session.start_time)} - {formatTo12Hour(session.end_time)}
                                        </div>
                                        <div className="text-[9px] text-white/20 font-black uppercase tracking-tighter">
                                            ID: #S-{session.id}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* TABLE VIEW */
                    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl animate-in fade-in duration-500">
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
                                    {filteredSessions.map((session) => {
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
                                                        <span className="text-xs">
                                                            {formatTo12Hour(session.start_time)} - {formatTo12Hour(session.end_time)}
                                                        </span>
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
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
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
                                <TimeSelect 
                                    label="Start Time"
                                    value={form.startTime}
                                    onChange={(val) => setForm({ ...form, startTime: val })}
                                />

                                <TimeSelect 
                                    label="End Time"
                                    value={form.endTime}
                                    onChange={(val) => setForm({ ...form, endTime: val })}
                                />

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
