import { useState, useEffect } from "react";
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
    plan_name: "", plan_duration: ""
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
      const res = await api.get('/enquiries');
      setEnquiries(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError("Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowups = async (enquiryId) => {
    try {
      setFollowupLoading(true);
      const res = await api.get(`/enquiry-followups/enquiry/${enquiryId}`);
      setFollowups(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching follow-ups", err);
    } finally {
      setFollowupLoading(false);
    }
  };

  const handleSubmitEnquiry = async (e) => {
    e.preventDefault();
    try {
      if (selectedEnquiry) {
        await api.put(`/enquiries/${selectedEnquiry.id}`, formData);
      } else {
        const res = await api.post('/enquiries', formData);
        setSelectedEnquiry(res.data);
      }
      fetchEnquiries();
      alert("Enquiry saved successfully!");
    } catch (err) {
      alert("Error saving enquiry");
    }
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    try {
      await api.post('/enquiry-followups', {
        ...followupFormData,
        enquiry_id: selectedEnquiry.id
      });
      fetchFollowups(selectedEnquiry.id);
      setFollowupFormData({
        followup_date: dayjs().format('YYYY-MM-DDTHH:mm'),
        notes: "",
        status: "followup",
        next_followup_date: ""
      });
      fetchEnquiries();
    } catch (err) {
      alert("Error adding follow-up");
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
      plan_name: "", plan_duration: ""
    });
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
                      <button className="p-1.5 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all">
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
               <button type="submit" className="px-8 py-2 bg-orange-600 text-white rounded-xl font-bold">Update Profile</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowupEnquiry;
