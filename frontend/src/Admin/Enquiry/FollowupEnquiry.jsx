import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Eye, Trash2, CheckCircle, XCircle, Clock, Users, X,
  ChevronLeft, ChevronRight, MessageSquare, Phone, Mail, Calendar,
  User, MapPin, Target, Activity, RefreshCcw, Save, Briefcase, History
} from "lucide-react";
import api from "../../api";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";
import dayjs from "dayjs";

const FollowupEnquiry = () => {
  const navigate = useNavigate();
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
  }, []);

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
        status: selectedEnquiry.status || "pending"
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
      emergency_contact_relationship: "", emergency_contact_address: "",
      emergency_contact_phone_home: "", emergency_contact_phone_work: "",
      fitness_goal: "", blood_group: "", gender: "", status: "pending",
      plan_name: "", plan_duration: "",
      reg_no: "", organization: "", website: "", best_time_to_reach: "",
      updated_by: "", referred_by: ""
    });
  };

  const handleDeleteEnquiry = async () => {
    if (!selectedEnquiry) return;
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await api.delete(`/followups/${selectedEnquiry.id}`);
      fetchEnquiries();
      setShowForm(false);
      alert("Record deleted successfully!");
    } catch (err) {
      alert("Error deleting record");
    }
  };

  // Filters
  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch =
      enquiry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.phone?.includes(searchTerm) ||
      enquiry.organization?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
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
        <div className="p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search name, phone, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500/50 outline-none w-80 transition-all placeholder:text-white/20"
                />
              </div>
            </h1>


          </div>

          <div className="flex items-center gap-4">
            <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />

            <button
              onClick={() => {
                setSelectedEnquiry(null);
                setShowForm(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-xl font-bold shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Followup
            </button>
          </div>
        </div>

        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500 p-2">



          {/* Table Body (Full Width) */}
          <div className="flex-1 overflow-y-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/5 backdrop-blur-xl border border-white/10  overflow-hidden z-10 text-white/40 uppercase text-[10px] tracking-[0.2em] font-black">
                <tr>
                  <th className="px-6 py-4 border-b border-white/5">Details</th>
                  <th className="px-6 py-4 border-b border-white/5">Organization</th>
                  <th className="px-6 py-4 border-b border-white/5">Status</th>
                  <th className="px-6 py-4 border-b border-white/5">Created</th>
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
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-base group-hover:text-orange-400 transition-colors">{enquiry.name}</span>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-white/40 text-xs">
                              <Phone size={10} /> {enquiry.phone}
                            </span>
                            <span className="flex items-center gap-1 text-white/40 text-xs">
                              <Mail size={10} /> {enquiry.email || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Briefcase size={14} className="text-white/20" />
                          <span className="text-white/60 font-medium">{enquiry.organization || enquiry.employer || "Individual"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(enquiry.status)}</td>
                      <td className="px-6 py-4 text-white/40 text-xs font-medium uppercase">
                        {dayjs(enquiry.created_at).format('MMM DD, YYYY')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2.5 bg-white/5 rounded-xl text-white/40 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-20 text-center">
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

          {/* Pagination Container */}
          <div className="p-4 border-t border-white/10 flex items-center justify-between bg-white/5">
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest">
              Showing {paginatedEnquiries.length} of {filteredEnquiries.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-white px-2">Page {currentPage} of {totalPages || 1}</span>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-30 hover:bg-white/10 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Modal (Dense Form + History at bottom) */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 max-h-[90vh] p-6 w-full max-w-5xl mx-4">
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
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                  {/* Left Side: Personal Info */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Date</label>
                      <input
                        type="datetime-local"
                        value={formData.created_at ? dayjs(formData.created_at).format('YYYY-MM-DDTHH:mm') : dayjs().format('YYYY-MM-DDTHH:mm')}
                        readOnly
                        className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                      />
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
                      <label className="text-xs font-bold text-white/60">Web Site</label>
                      <input
                        type="text"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="www.example.com"
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
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 text-orange-500" />
                          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">SMS</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Best Time To Reach</label>
                      <input
                        type="text"
                        value={formData.best_time_to_reach}
                        onChange={(e) => setFormData({ ...formData, best_time_to_reach: e.target.value })}
                        placeholder="e.g., 10 AM - 12 PM"
                        className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                      />
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
                        className="col-span-2 bg-white/10 border border-white/10 rounded-xl px-4 py-2.5 text-orange-400 font-bold outline-none"
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
