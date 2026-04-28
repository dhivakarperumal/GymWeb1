import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Search, Eye, Trash2, CheckCircle, XCircle, Clock, Users, X, 
  ChevronLeft, ChevronRight, MessageSquare, Phone, Mail, Calendar, 
  User, MapPin, Target, Activity, RefreshCcw, Save
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
  const [loading, setLoading] = useState(true);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  // Default to followup status
  const [statusFilter, setStatusFilter] = useState("followup");
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });
  
  // Selection
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("followup"); // Default to followup tab
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Form Data
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", subject: "", message: "",
    height: "", weight: "", bmi: "", dob: "", age: "", address: "",
    employer: "", occupation: "", emergency_contact_name: "",
    emergency_contact_relationship: "", emergency_contact_address: "",
    emergency_contact_phone_home: "", emergency_contact_phone_work: "",
    fitness_goal: "", blood_group: "", gender: "", status: "followup",
    plan_name: "", plan_duration: "",
    reg_no: "", organization: "", website: "", best_time_to_reach: "",
    updated_by: "", referred_by: ""
  });

  const [followupFormData, setFollowupFormData] = useState({
    followup_date: dayjs().format('YYYY-MM-DDTHH:mm'),
    notes: "",
    status: "followup",
    next_followup_date: ""
  });

  // Effects
  useEffect(() => {
    fetchEnquiries();
  }, []);

  useEffect(() => {
    if (selectedEnquiry) {
      fetchFollowups(selectedEnquiry.id);
      setFormData({
        ...selectedEnquiry,
        dob: selectedEnquiry.dob ? dayjs(selectedEnquiry.dob).format('YYYY-MM-DD') : "",
        status: selectedEnquiry.status || "followup"
      });
    } else {
      resetForm();
    }
  }, [selectedEnquiry]);

  useEffect(() => {
    if (formData.height && formData.weight) {
      const h = parseFloat(formData.height) / 100;
      const w = parseFloat(formData.weight);
      if (h > 0) {
        const bmiVal = (w / (h * h)).toFixed(1);
        setFormData(prev => ({ ...prev, bmi: bmiVal }));
      }
    }
  }, [formData.height, formData.weight]);

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
    e.preventDefault();
    try {
      if (selectedEnquiry) {
        await api.put(`/followups/${selectedEnquiry.id}`, formData);
      } else {
        await api.post("/followups", formData);
      }
      fetchEnquiries();
      setShowForm(false);
      alert("Follow-up record saved successfully!");
    } catch (err) {
      alert("Error saving follow-up record");
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
      alert("Interaction logged!");
    } catch (err) {
      alert("Error logging interaction");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "", email: "", phone: "", subject: "", message: "",
      height: "", weight: "", bmi: "", dob: "", age: "", address: "",
      employer: "", occupation: "", emergency_contact_name: "",
      emergency_contact_relationship: "", emergency_contact_address: "",
      emergency_contact_phone_home: "", emergency_contact_phone_work: "",
      fitness_goal: "", blood_group: "", gender: "", status: "followup",
      plan_name: "", plan_duration: "",
      reg_no: "", organization: "", website: "", best_time_to_reach: "",
      updated_by: "", referred_by: ""
    });
  };

  const handleDeleteEnquiry = async () => {
    if (!selectedEnquiry) return;
    if (!window.confirm("Are you sure you want to delete this follow-up record?")) return;
    try {
      await api.delete(`/followups/${selectedEnquiry.id}`);
      fetchEnquiries();
      setShowForm(false);
      alert("Follow-up record deleted successfully!");
    } catch (err) {
      alert("Error deleting follow-up record");
    }
  };

  // Filters
  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = 
      enquiry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.phone?.includes(searchTerm) ||
      enquiry.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || enquiry.status === statusFilter;
    
    if (!(matchesSearch && matchesStatus)) return false;
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
    <div className="flex flex-col h-[calc(100vh-100px)] gap-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <RefreshCcw className="w-6 h-6 text-orange-500" />
              Follow Up Management
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text"
                placeholder="Search name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500 outline-none w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
             <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />

             <button 
              onClick={() => navigate("/admin/enquiry")}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all shadow-lg whitespace-nowrap"
            >
              <Users size={16} className="text-orange-500" />
              General Enquiry
            </button>

            <button 
              onClick={() => {
                setSelectedEnquiry(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all outline-none"
            >
              <Plus className="w-4 h-4" />
              Add Enquiry
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/60 uppercase text-[10px] tracking-widest font-bold">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="5" className="py-10 text-center text-white/40 italic">Loading follow-ups...</td></tr>
              ) : paginatedEnquiries.length > 0 ? (
                paginatedEnquiries.map((enquiry) => (
                  <tr 
                    key={enquiry.id} 
                    onClick={() => setSelectedEnquiry(enquiry)}
                    className={`cursor-pointer transition-all hover:bg-white/5 ${selectedEnquiry?.id === enquiry.id ? 'bg-orange-500/10 border-l-2 border-orange-500' : ''}`}
                  >
                    <td className="px-4 py-3 text-white/60">{dayjs(enquiry.created_at).format('DD-MM-YYYY')}</td>
                    <td className="px-4 py-3 font-bold text-white">{enquiry.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-white">{enquiry.phone}</span>
                        <span className="text-white/40 text-xs">{enquiry.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(enquiry.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEnquiry(enquiry);
                          setShowForm(true);
                        }}
                        className="p-1.5 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="py-10 text-center text-white/40 italic">No follow-ups needed</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex border-b border-white/10 bg-white/5">
          <button 
            onClick={() => setActiveTab("followup")}
            className={`px-8 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === "followup" ? 'text-orange-500 border-orange-500 bg-orange-500/5' : 'text-white/40 border-transparent hover:text-white'}`}
          >
            Follow Up Activity
          </button>
          <button 
            onClick={() => setActiveTab("details")}
            className={`px-8 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === "details" ? 'text-orange-500 border-orange-500 bg-orange-500/5' : 'text-white/40 border-transparent hover:text-white'}`}
          >
            Client Profile
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === "followup" ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                <div className="space-y-6">
                  <h3 className="text-white text-lg font-bold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-orange-500" />
                    New Log
                  </h3>
                  <form onSubmit={handleAddFollowup} className="space-y-4 bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Date</label>
                        <input 
                          type="datetime-local"
                          value={followupFormData.followup_date}
                          onChange={(e) => setFollowupFormData({...followupFormData, followup_date: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Next Call</label>
                        <input 
                          type="date"
                          value={followupFormData.next_followup_date}
                          onChange={(e) => setFollowupFormData({...followupFormData, next_followup_date: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Notes</label>
                      <textarea 
                        required
                        value={followupFormData.notes}
                        onChange={(e) => setFollowupFormData({...followupFormData, notes: e.target.value})}
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <button type="submit" className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-bold">
                      Save Interaction
                    </button>
                  </form>
                </div>
                <div className="space-y-6">
                  <h3 className="text-white text-lg font-bold">History</h3>
                  <div className="space-y-4">
                    {followups.map((fu, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex justify-between text-[10px] font-bold text-white/40 mb-2">
                          <span>{dayjs(fu.followup_date).format('MMM DD, YYYY HH:mm')}</span>
                          {getStatusBadge(fu.status)}
                        </div>
                        <p className="text-sm text-white">{fu.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>
             </div>
          ) : (
            <form onSubmit={handleSubmitEnquiry} className="space-y-6">
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Full Name</label>
                    <input type="text" value={formData.name} onChange={(e)=>setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Phone</label>
                    <input type="tel" value={formData.phone} onChange={(e)=>setFormData({...formData, phone: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"/>
                  </div>
               </div>
               <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-8 py-2 bg-orange-600 text-white rounded-xl font-bold"
                >
                  Update Profile
                </button>
            </form>
          )}
        </div>
      </div>
      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-orange-500" />
                {selectedEnquiry ? 'Edit Enquiry Details' : 'Add New Enquiry'}
              </h2>
              <button 
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitEnquiry} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Main Info Grid - Matching Screenshot Density */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Date</label>
                    <input 
                      type="datetime-local" 
                      value={formData.created_at ? dayjs(formData.created_at).format('YYYY-MM-DDTHH:mm') : dayjs().format('YYYY-MM-DDTHH:mm')} 
                      readOnly
                      className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Name</label>
                    <div className="col-span-2 relative">
                      <input 
                        required
                        type="text" 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                      <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-red-500 font-bold">*</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Date Of Birth</label>
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      <input 
                        type="date" 
                        value={formData.dob} 
                        onChange={(e) => setFormData({...formData, dob: e.target.value})}
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-white/40 uppercase">Age</label>
                        <input 
                          type="text" 
                          value={formData.age} 
                          readOnly
                          className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-2 text-white outline-none text-xs text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Gender</label>
                    <select 
                      value={formData.gender} 
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none appearance-none"
                    >
                      <option value="">[SELECT]</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Email</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Phone</label>
                    <input 
                      type="tel" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 items-start gap-4">
                    <label className="text-sm font-bold text-white/60">Address</label>
                    <textarea 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows={2}
                      className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 items-start gap-4">
                    <label className="text-sm font-bold text-white/60">Message</label>
                    <div className="col-span-2 relative">
                      <textarea 
                        value={formData.message} 
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
                      />
                      <span className="absolute -right-4 top-4 text-red-500 font-bold">*</span>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Reg. No</label>
                    <input 
                      type="text" 
                      value={formData.id || ""} 
                      readOnly
                      className="col-span-2 bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Organization</label>
                    <input 
                      type="text" 
                      value={formData.employer || ""} 
                      onChange={(e) => setFormData({...formData, employer: e.target.value})}
                      className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Web Site</label>
                    <input 
                      type="text" 
                      value={formData.website || ""} 
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Mobile</label>
                    <div className="col-span-2 flex items-center gap-3">
                      <div className="flex-1 relative">
                        <input 
                          type="tel" 
                          value={formData.phone} 
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
                        />
                        <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-red-500 font-bold">*</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input type="checkbox" className="w-3 h-3 rounded" />
                        <span className="text-[10px] text-white/40 font-bold">SMS</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Best Time To Reach</label>
                    <input 
                      type="text" 
                      value={formData.best_time_to_reach || ""} 
                      onChange={(e) => setFormData({...formData, best_time_to_reach: e.target.value})}
                      className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Status</label>
                    <select 
                      value={formData.status} 
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none appearance-none"
                    >
                      <option value="">[SELECT]</option>
                      <option value="pending">Pending</option>
                      <option value="followup">Followup</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Plan</label>
                    <select 
                      value={formData.plan_name} 
                      onChange={(e) => setFormData({...formData, plan_name: e.target.value})}
                      className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none appearance-none"
                    >
                      <option value="">[SELECT]</option>
                      <option value="3 Months">3 Months</option>
                      <option value="6 Months">6 Months</option>
                      <option value="12 Months">12 Months</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Updated By</label>
                    <input 
                      type="text" 
                      value={formData.updated_by || ""} 
                      readOnly
                      className="col-span-2 bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 items-center gap-4">
                    <label className="text-sm font-bold text-white/60">Referred By</label>
                    <input 
                      type="text" 
                      value={formData.referred_by || ""} 
                      onChange={(e) => setFormData({...formData, referred_by: e.target.value})}
                      className="col-span-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none"
                    />
                  </div>
                </div>

              </div>

              <div className="flex justify-end gap-3 pt-8 border-t border-white/5">
                <button 
                  type="submit"
                  className="px-8 py-2 bg-white/10 text-white rounded-lg font-bold border border-white/10 hover:bg-white/20 transition-all"
                >
                  {selectedEnquiry ? 'Update' : 'Save'}
                </button>
                <button 
                  type="button"
                  onClick={resetForm}
                  className="px-8 py-2 bg-white/10 text-white rounded-lg font-bold border border-white/10 hover:bg-white/20 transition-all"
                >
                  Clear
                </button>
                {selectedEnquiry && (
                  <button 
                    type="button"
                    onClick={handleDeleteEnquiry}
                    className="px-8 py-2 bg-red-500/20 text-red-500 rounded-lg font-bold border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                  >
                    Delete
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-8 py-2 bg-white/10 text-white rounded-lg font-bold border border-white/10 hover:bg-white/20 transition-all"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowupEnquiry;
