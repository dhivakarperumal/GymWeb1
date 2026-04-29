import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Eye, Trash2, CheckCircle, XCircle, Clock, Users, X,
  ChevronLeft, ChevronRight, MessageSquare, Phone, Mail, Calendar,
  User, MapPin, Target, Activity, RefreshCcw, Save, Briefcase, History, Edit2, ChevronDown
} from "lucide-react";
import api from "../../api";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";
import dayjs from "dayjs";
import { useAuth } from "../../PrivateRouter/AuthContext";

const FollowupEnquiry = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  // State
  const [enquiries, setEnquiries] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });

  // Selection
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // View mode: 'table' | 'card'
  const [viewMode, setViewMode] = useState('table');

  // Status filter
  const [statusFilter, setStatusFilter] = useState('all');
  const [trainerFilter, setTrainerFilter] = useState('all');
  const [trainers, setTrainers] = useState([]);

  // Form Data
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", subject: "", message: "",
    height: "", weight: "", bmi: "", dob: "", age: "", address: "",
    employer: "", occupation: "", emergency_contact_name: "",
    emergency_contact_relationship: "", emergency_contact_address: "",
    emergency_contact_phone_home: "", emergency_contact_phone_work: "",
    fitness_goal: "", blood_group: "", gender: "", status: "pending",
    plan_name: "", plan_price: "", plan_duration: "",
    reg_no: "", organization: "", website: "", best_time_to_reach: "",
    updated_by: "", referred_by: ""
  });

  const [followupFormData, setFollowupFormData] = useState({
    followup_date: dayjs().format('YYYY-MM-DDTHH:mm'),
    notes: "",
    status: "pending",
    next_followup_date: ""
  });

  // Effects
  useEffect(() => {
    fetchEnquiries();
    fetchPlans();
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const res = await api.get("/staff");
      // filter only those who might handle enquiries, or show all staff who have logged something
      setTrainers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching staff", err);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get("/plans");
      setPlans(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching plans", err);
    }
  };

  useEffect(() => {
    if (selectedEnquiry) {
      fetchFollowups(selectedEnquiry.id);
      setFormData({
        ...selectedEnquiry,
        dob: selectedEnquiry.dob ? dayjs(selectedEnquiry.dob).format('YYYY-MM-DD') : "",
        status: selectedEnquiry.status || "pending",
        updated_by: selectedEnquiry.updated_by || user?.username || "Admin"
      });
    } else {
      resetForm();
    }
  }, [selectedEnquiry]);

  useEffect(() => {
    if (formData.dob) {
      const age = dayjs().diff(dayjs(formData.dob), 'year');
      setFormData(prev => ({ ...prev, age: age.toString() }));
    }
  }, [formData.dob]);

  // Actions
  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/followups");
      setEnquiries(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Failed to load follow-ups");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnquiry = async (id) => {
    const targetId = id || (selectedEnquiry ? selectedEnquiry.id : null);
    if (!targetId) return;

    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await api.delete(`/enquiries/${targetId}`);
        fetchEnquiries();
        if (showForm) setShowForm(false);
        alert("Record deleted successfully!");
      } catch (err) {
        console.error("Error deleting enquiry", err);
        alert("Failed to delete record");
      }
    }
  };

  const fetchFollowups = async (followupId) => {
    try {
      setFollowupLoading(true);
      const res = await api.get(`/followups/${followupId}/interactions`);
      setFollowups(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching interactions", err);
    } finally {
      setFollowupLoading(false);
    }
  };

  const handleSubmitEnquiry = async (e) => {
    if (e) e.preventDefault();
    try {
      if (selectedEnquiry && selectedEnquiry.id) {
        await api.put(`/followups/${selectedEnquiry.id}`, formData);
      } else {
        await api.post("/followups", formData);
      }
      fetchEnquiries();
      setShowForm(false);
      alert("Record saved successfully!");
    } catch (err) {
      alert("Error saving record");
    }
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    try {
      await api.post("/followups/interactions", {
        followup_id: selectedEnquiry.id,
        ...followupFormData
      });
      setFollowupFormData({
        followup_date: dayjs().format('YYYY-MM-DDTHH:mm'),
        notes: "",
        status: "pending",
        next_followup_date: ""
      });
      fetchFollowups(selectedEnquiry.id);
      fetchEnquiries();
      alert("Activity logged!");
    } catch (err) {
      alert("Error logging activity");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "", email: "", phone: "", subject: "", message: "",
      height: "", weight: "", bmi: "", dob: "", age: "", address: "",
      employer: "", occupation: "", emergency_contact_name: "",
      relationship: "", emergency_contact_address: "",
      phone_home: "", phone_work: "",
      fitness_goal: "", blood_group: "", gender: "", status: "pending",
      plan_name: "", plan_duration: "",
      reg_no: "", organization: "", website: "", best_time_to_reach: "",
      updated_by: user?.username || "Admin", referred_by: ""
    });
  };

  // Filters
  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch =
      enquiry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.phone?.includes(searchTerm) ||
      enquiry.organization?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;
    const matchesAccess = role === 'admin' || enquiry.updated_by === user?.username;
    
    let matchesTrainer = true;
    if (role === 'admin' && trainerFilter !== 'all') {
      matchesTrainer = enquiry.updated_by === trainerFilter;
    }

    if (!matchesSearch || !matchesStatus || !matchesAccess || !matchesTrainer) return false;
    return filterByDateRange([enquiry], 'created_at', dateRange.type, dateRange.range).length > 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage);
  const paginatedEnquiries = filteredEnquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50",
      completed: "bg-green-500/20 text-green-500 border-green-500/50",
      cancelled: "bg-red-500/20 text-red-500 border-red-500/50",
      followup: "bg-blue-500/20 text-blue-500 border-blue-500/50"
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || styles.pending}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  return (
    <>
      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Header Area */}
        <div className="p-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="Search name, phone, company..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500/50 outline-none w-72 transition-all placeholder:text-white/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />

            {/* Status Filter */}
            <div className="relative group">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="py-2.5 pl-4 pr-10 bg-transparent border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none cursor-pointer transition-all backdrop-blur-md hover:bg-white/5 w-full"
              >
                <option value="all" className="bg-neutral-900">All Status</option>
                <option value="pending" className="bg-neutral-900">Pending</option>
                <option value="followup" className="bg-neutral-900">Followup</option>
                <option value="completed" className="bg-neutral-900">Completed</option>
                <option value="cancelled" className="bg-neutral-900">Cancelled</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none group-hover:text-white transition-colors" />
            </div>

            {/* Staff Filter */}
            {role === 'admin' && (
              <div className="relative group">
                <select
                  value={trainerFilter}
                  onChange={(e) => { setTrainerFilter(e.target.value); setCurrentPage(1); }}
                  className="py-2.5 pl-4 pr-10 bg-transparent border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none cursor-pointer transition-all backdrop-blur-md hover:bg-white/5 w-full"
                >
                  <option value="all" className="bg-neutral-900">All Staff</option>
                  {trainers.map(s => (
                    <option key={s.id} value={s.username || s.name} className="bg-neutral-900">
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none group-hover:text-white transition-colors" />
              </div>
            )}

            {/* View Toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-orange-500 text-white' : 'text-white/40 hover:text-white'}`}
                title="Table View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-orange-500 text-white' : 'text-white/40 hover:text-white'}`}
                title="Card View"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedEnquiry(null);
                setShowForm(true);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-xl font-bold shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>
        </div>

        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500 p-2">

          {/* CARD VIEW */}
          {viewMode === 'card' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {paginatedEnquiries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedEnquiries.map((enquiry, index) => (
                    <div
                      key={enquiry.id}
                      className="group bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-orange-500/40 hover:bg-white/10 transition-all cursor-pointer flex flex-col gap-3"
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
                          {enquiry.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusBadge(enquiry.status)}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div>
                        <p className="text-white font-black text-sm group-hover:text-orange-400 transition-colors">{enquiry.name}</p>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                          {enquiry.organization || enquiry.employer || 'Direct Lead'}
                        </p>
                      </div>

                      {/* Card Footer */}
                      <div className="flex flex-col gap-1 mt-auto pt-3 border-t border-white/5">
                        <span className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                          <Phone size={10} className="text-orange-500" /> {enquiry.phone || 'N/A'}
                        </span>
                        <span className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                          <Mail size={10} className="text-orange-500" /> {enquiry.email || 'N/A'}
                        </span>
                        <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest mt-1">
                          {dayjs(enquiry.created_at).format('MMM DD, YYYY')}
                        </span>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => { setSelectedEnquiry(enquiry); setShowForm(true); }}
                          className="flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEnquiry(enquiry.id)}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 hover:border-red-500/50 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-white/20">
                  <History size={48} strokeWidth={1} />
                  <p className="text-sm font-medium">No records found</p>
                </div>
              )}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="flex-1 mt-5 overflow-y-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white/5 backdrop-blur-xl border border-white/10  overflow-hidden z-10 text-white/40 uppercase text-[10px] tracking-[0.2em] font-black">
                  <tr>
                    <th className="px-6 py-4 border-b border-white/5 w-16">S No</th>
                    <th className="px-6 py-4 border-b border-white/5 text-left">Name</th>
                    <th className="px-6 py-4 border-b border-white/5 text-left">Mobile</th>
                    <th className="px-6 py-4 border-b border-white/5 text-left">Organization</th>
                    <th className="px-6 py-4 border-b border-white/5 text-left">Status</th>
                    <th className="px-6 py-4 border-b border-white/5 text-left">Created</th>
                    <th className="px-6 py-4 border-b border-white/5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan="5" className="py-20 text-center"><div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" /></td></tr>
                  ) : paginatedEnquiries.length > 0 ? (
                    paginatedEnquiries.map((enquiry) => (
                      <tr
                        key={enquiry.id}
                        className="group hover:bg-white/5 transition-all cursor-pointer"
                        onClick={() => {
                          setSelectedEnquiry(enquiry);
                          setShowForm(true);
                        }}
                      >
                        <td className="px-6 py-4 text-xs font-bold text-white/40">
                          {(currentPage - 1) * itemsPerPage + paginatedEnquiries.indexOf(enquiry) + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-base group-hover:text-orange-400 transition-colors">
                              {enquiry.name}
                            </span>
                            <span className="flex items-center gap-1 text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
                              <Mail size={10} /> {enquiry.email || 'No Email'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-2 text-white/60 text-sm font-bold">
                            <Phone size={12} className="text-orange-500" />
                            {enquiry.phone || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-white/60">
                          {enquiry.organization || enquiry.employer || 'Direct Lead'}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(enquiry.status)}
                        </td>
                        <td className="px-6 py-4 text-[10px] text-white/40 font-bold">
                          {dayjs(enquiry.created_at).format('MMM DD, YYYY')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setSelectedEnquiry(enquiry); setShowForm(true); }}
                              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-blue-400 hover:border-blue-400/50 transition-all"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => { setSelectedEnquiry(enquiry); setShowForm(true); }}
                              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-orange-500 hover:border-orange-500/50 transition-all"
                              title="Edit"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteEnquiry(enquiry.id)}
                              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 hover:border-red-500/50 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-white/20">
                          <History size={48} strokeWidth={1} />
                          <p className="text-sm font-medium">No records found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )} {/* End table view ternary */}

          {/* Footer / Pagination — only shown when records exceed 10 */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between mt-auto">
              <div className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">
                Showing {paginatedEnquiries.length} of {filteredEnquiries.length} entries
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white font-black uppercase tracking-[0.1em]">
                  Page {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Modal (Dense Form + History at bottom) */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl w-full max-w-6xl max-h-[93vh] overflow-hidden shadow-2xl flex flex-col relative">
              {/* Modal Header */}
              <div className="p-2 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">

                  <div className="p-2">
                    <h2 className="text-2xl font-black text-white">{selectedEnquiry ? 'Followup Management' : 'Create New Followup'}</h2>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-0.5">
                      {selectedEnquiry ? `ID: #F-${selectedEnquiry.id}` : 'New Entry'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content - Scrollable Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                  {/* Left Side: Personal Info */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Entry Date</label>
                      <div className="col-span-2 grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={formData.created_at ? dayjs(formData.created_at).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')}
                          readOnly
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/60 outline-none text-xs font-bold"
                        />
                        <input
                          type="time"
                          value={formData.created_at ? dayjs(formData.created_at).format('HH:mm') : dayjs().format('HH:mm')}
                          readOnly
                          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/60 outline-none text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Name</label>
                      <div className="col-span-2 relative">
                        <input
                          required
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter lead full name"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-orange-500/50 outline-none"
                        />
                        <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-red-500 font-bold">*</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Date Of Birth</label>
                      <div className="col-span-2 grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-black text-white/20 uppercase">Age</label>
                          <input
                            type="text"
                            value={formData.age}
                            readOnly
                            className="w-full bg-white/10 border border-white/10 rounded-xl px-2 py-2.5 text-white outline-none text-xs text-center font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none appearance-none"
                      >
                        <option value="">[SELECT]</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g., name@example.com"
                        className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g., +91 9876543210"
                        className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 items-start gap-4">
                      <label className="text-xs font-bold text-white/60 pt-2">Address</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={2}
                        placeholder="House No, Street, City, State, ZIP"
                        className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 items-start gap-4">
                      <label className="text-xs font-bold text-white/60 pt-2">Message</label>
                      <div className="col-span-2 relative">
                        <textarea
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          rows={2}
                          placeholder="Additional details or special requirements..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none resize-none"
                        />
                        <span className="absolute -right-4 top-4 text-red-500 font-bold">*</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Professional Info */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Reg. No</label>
                      <input
                        type="text"
                        value={formData.id ? `#F-${formData.id}` : "NEW"}
                        readOnly
                        className="col-span-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white/60 outline-none font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Organization</label>
                      <input
                        type="text"
                        value={formData.organization || formData.employer || ""}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value, employer: e.target.value })}
                        placeholder="Company or Employer name"
                        className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                      />
                    </div>



                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Mobile</label>
                      <div className="col-span-2 flex items-center gap-4">
                        <div className="flex-1 relative">
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="Secondary contact..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                          />
                          <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-red-500 font-bold">*</span>
                        </div>
                      </div>
                    </div>



                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none appearance-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="followup">Followup</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Plan</label>
                      <select
                        value={formData.plan_name}
                        onChange={(e) => {
                          const selectedPlan = plans.find(p => p.name === e.target.value);
                          setFormData({
                            ...formData,
                            plan_name: e.target.value,
                            plan_price: selectedPlan ? (selectedPlan.finalPrice || selectedPlan.price) : ""
                          });
                        }}
                        className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none appearance-none"
                      >
                        <option value="">[SELECT PLAN]</option>
                        {plans.map(plan => (
                          <option key={plan.id} value={plan.name}>
                            {plan.name} - ₹{plan.finalPrice || plan.price}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Plan Price</label>
                      <input
                        type="text"
                        value={formData.plan_price ? `₹${formData.plan_price}` : ""}
                        readOnly
                        placeholder="Auto-filled on plan select"
                        className="col-span-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-orange-400 font-bold outline-none placeholder:text-white/20 placeholder:font-normal placeholder:text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Updated By</label>
                      <input
                        type="text"
                        value={formData.updated_by || "Admin"}
                        readOnly
                        className="col-span-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-white/40 outline-none text-xs font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Referred By</label>
                      <input
                        type="text"
                        value={formData.referred_by}
                        onChange={(e) => setFormData({ ...formData, referred_by: e.target.value })}
                        placeholder="Agent name or Friend's name"
                        className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Interaction History & Log New Interaction */}
                {selectedEnquiry ? (
                  <div className="mt-12 pt-12 border-t border-white/10">
                    <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                      <History className="text-orange-500" /> Interaction History
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                      {/* Interaction Form */}
                      <div className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                        <h4 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">Log New Activity</h4>
                        <form onSubmit={handleAddFollowup} className="space-y-4">
                          <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase mb-1 block">Activity Date</label>
                            <input
                              type="datetime-local"
                              value={followupFormData.followup_date}
                              onChange={(e) => setFollowupFormData({ ...followupFormData, followup_date: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-white/40 uppercase mb-1 block">Activity Notes</label>
                            <textarea
                              required
                              value={followupFormData.notes}
                              onChange={(e) => setFollowupFormData({ ...followupFormData, notes: e.target.value })}
                              placeholder="What was discussed?"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none h-24 resize-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-white/40 uppercase mb-1 block">Outcome</label>
                              <select
                                value={followupFormData.status}
                                onChange={(e) => setFollowupFormData({ ...followupFormData, status: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs outline-none appearance-none"
                              >
                                <option value="pending">Pending</option>
                                <option value="followup">Followup</option>
                                <option value="completed">Interested</option>
                                <option value="cancelled">Not Interested</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-white/40 uppercase mb-1 block">Next Follow-up</label>
                              <input
                                type="date"
                                value={followupFormData.next_followup_date}
                                onChange={(e) => setFollowupFormData({ ...followupFormData, next_followup_date: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-xs outline-none"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-lg"
                          >
                            Save Activity
                          </button>
                        </form>
                      </div>

                      {/* Interaction Timeline */}
                      <div className="lg:col-span-2 space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                        {followupLoading ? (
                          <div className="py-10 text-center"><div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" /></div>
                        ) : followups.length > 0 ? (
                          followups.map((f, idx) => (
                            <div key={idx} className="relative pl-8 pb-8 border-l border-white/10 last:border-0 last:pb-0">
                              <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                                    {dayjs(f.followup_date).format('MMM DD, YYYY - HH:mm')}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                                    f.status === 'completed' ? 'border-green-500/50 text-green-500' : 
                                    f.status === 'cancelled' ? 'border-red-500/50 text-red-500' :
                                    'border-blue-500/50 text-blue-500'
                                  }`}>
                                    {f.status}
                                  </span>
                                </div>
                                <p className="text-white/80 text-sm">{f.notes}</p>
                                {f.next_followup_date && (
                                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase">
                                    <Clock size={12} className="text-orange-500" /> Next Follow-up: {dayjs(f.next_followup_date).format('MMM DD, YYYY')}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center bg-white/5 border border-white/10 border-dashed rounded-3xl text-white/20">
                            <MessageSquare size={32} strokeWidth={1} className="mx-auto mb-2" />
                            <p className="text-xs font-bold uppercase tracking-widest">No interactions logged yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-12 p-20 text-center border-t border-white/10 text-white/20">
                    <div className="max-w-sm mx-auto space-y-4">
                      <Target size={48} strokeWidth={1} className="mx-auto" />
                      <p className="text-sm font-bold uppercase tracking-widest leading-relaxed">
                        Please save the lead details first to enable interaction tracking and activity logging.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-2 border-t border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex gap-4">
                  {selectedEnquiry && (
                    <button
                      type="button"
                      onClick={handleDeleteEnquiry}
                      className="px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                    >
                      <Trash2 size={16} /> Delete Record
                    </button>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-8 py-3 bg-white/5 text-white/60 rounded-2xl font-bold text-sm hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitEnquiry}
                    className="px-12 py-3 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    {selectedEnquiry && selectedEnquiry.id ? 'Update Followup' : 'Create Followup'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>

  );
};

export default FollowupEnquiry;
