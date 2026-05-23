import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Eye, Trash2, CheckCircle, XCircle, Clock, Users, X,
  ChevronLeft, ChevronRight, MessageSquare, Phone, Mail, Calendar,
  User, MapPin, Target, Activity, RefreshCcw, Save, Briefcase, History, Edit2, ChevronDown,
  FileText, Download
} from "lucide-react";
import api from "../../api";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";
import dayjs from "dayjs";
import { useAuth } from "../../PrivateRouter/AuthContext";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

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
  const itemsPerPage = 25;

  // View mode: 'table' | 'card'
  const [viewMode, setViewMode] = useState('table');

  // Status filter
  const [statusFilter, setStatusFilter] = useState('all');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [staffFilter, setStaffFilter] = useState('all');
  const [isStaffOpen, setIsStaffOpen] = useState(false);
  const [assignedTrainerFilter, setAssignedTrainerFilter] = useState('all');
  const [trainers, setTrainers] = useState([]);
  const [importErrors, setImportErrors] = useState([]);

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
    next_followup_date: "",
    updated_by: "", referred_by: "",
    trainer_id: "", trainer_name: ""
  });

  const [followupFormData, setFollowupFormData] = useState({
    interaction_date: dayjs().format('YYYY-MM-DDTHH:mm'),
    notes: "",
    status: "pending",
    next_followup_date: ""
  });

  const currentStaff = useMemo(() => trainers.find(t =>
    t.email === user?.email ||
    t.username === user?.username ||
    t.phone === user?.mobile
  ), [trainers, user]);

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
        next_followup_date: selectedEnquiry.next_followup_date ? dayjs(selectedEnquiry.next_followup_date).format('YYYY-MM-DD') : "",
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
        await api.delete(`/followups/${targetId}`);
        fetchEnquiries();
        if (showForm) setShowForm(false);
        toast.success("Record deleted successfully!");
      } catch (err) {
        console.error("Error deleting enquiry", err);
        toast.error("Failed to delete record");
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

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formData.phone || formData.phone.length !== 10) {
      toast.error("A valid 10-digit mobile number is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      if (selectedEnquiry && selectedEnquiry.id) {
        await api.put(`/followups/${selectedEnquiry.id}`, formData);
      } else {
        await api.post("/followups", formData);
      }
      fetchEnquiries();
      setShowForm(false);
      toast.success("Record saved successfully!");
    } catch (err) {
      toast.error("Error saving record");
    }
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    try {
      await api.post("/followups/interactions", {
        followup_id: selectedEnquiry.id,
        ...followupFormData,
        staff_name: user?.name || user?.username || 'Admin'
      });
      setFollowupFormData({
        interaction_date: dayjs().format('YYYY-MM-DDTHH:mm'),
        notes: "",
        status: "pending",
        next_followup_date: ""
      });
      fetchFollowups(selectedEnquiry.id);
      fetchEnquiries();
      toast.success("Activity logged!");
    } catch (err) {
      toast.error("Error logging activity");
    }
  };

  const handleMoveToMembers = async (enquiry) => {
    try {
      await api.post(`/followups/${enquiry.id}/convert`);
      toast.success('Member created successfully from followup. Login using Mobile Number as password.');
      fetchEnquiries();
    } catch (err) {
      console.error('Error moving to members:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to create member';
      alert(msg);
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
      plan_name: "", plan_duration: "", plan_price: "",
      reg_no: "", organization: "", website: "", best_time_to_reach: "",
      next_followup_date: "",
      updated_by: user?.username || "Admin", referred_by: "",
      trainer_id: (role !== 'admin' && currentStaff) ? currentStaff.id : "",
      trainer_name: (role !== 'admin' && currentStaff) ? (currentStaff.name || currentStaff.username) : ""
    });
    setImportErrors([]);
  };

  const excelDateToJSDate = (serial) => {
    if (!serial) return "";
    if (typeof serial === 'string' && serial.includes('-')) return serial;
    try {
      const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    } catch (e) {
      return serial;
    }
  };

  /* ---------------- EXCEL IMPORT ---------------- */
  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log("Excel Data:", jsonData);

        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (const row of jsonData) {
          if (!row || Object.keys(row).length === 0) continue;

          // Broad mapping
          const name = (row["Lead Name"] || row["Full Name"] || row.Name || row["Customer Name"] || row.name || "Unknown").toString().trim();
          const email = (row["Email Address"] || row.Email || row.email || "").toString().trim();
          const rawPhone = row.Phone || row.Mobile || row["Mobile Number"] || row["Mobile Number"] || row.phone || row.mobile || "";
          const phone = rawPhone.toString().replace(/\D/g, '').slice(-10);

          if (name === "Unknown" || !phone || phone.length < 10) {
            errors.push({ 
              name: name === "Unknown" ? "Row with missing name" : name, 
              reason: !phone ? "Missing Phone" : phone.length < 10 ? "Invalid Phone" : "Missing Name" 
            });
            failCount++;
            continue;
          }

          // Check for duplicates
          const isDuplicate = enquiries.some(e =>
            (email && e.email?.toLowerCase() === email.toLowerCase()) ||
            (phone && e.phone === phone)
          );

          if (isDuplicate) {
            errors.push({ name: name, reason: "Duplicate lead" });
            failCount++;
            continue;
          }

          const payload = {
            name: name,
            email: email,
            phone: phone,
            subject: row.Subject || row.subject || "General Inquiry",
            message: row.Message || row.message || row.Notes || row.notes || "",
            gender: row.Gender || row.gender || "",
            dob: excelDateToJSDate(row.DOB || row["Date of Birth"] || row.dob),
            organization: row.Organization || row.Company || row.employer || row.Employer || "",
            status: (row.Status || row.status || "pending").toLowerCase(),
            plan_name: row.Plan || row["Plan Name"] || row.plan || "",
            referred_by: row["Referred By"] || row.Referral || row.referral || "",
            updated_by: user?.username || "Admin"
          };

          try {
            await api.post("/followups", payload);
            successCount++;
          } catch (err) {
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
            errors.push({ name: name, reason: errorMsg });
            failCount++;
          }
        }

        setImportErrors(errors);
        if (successCount > 0) toast.success(`Successfully imported ${successCount} leads!`);
        if (failCount > 0) toast.error(`Failed to import ${failCount} leads. See summary below.`);
        fetchEnquiries();
      } catch (err) {
        console.error(err);
        toast.error("Failed to read Excel file");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const exportToExcel = () => {
    const dataToExport = filteredEnquiries.map((e, index) => ({
      "S.No": index + 1,
      "Lead Name": e.name,
      "Mobile Number": e.phone,
      "Email": e.email,
      "Organization": e.organization || e.employer || "Direct",
      "Plan": e.plan_name || "N/A",
      "Status": e.status,
      "Created Date": dayjs(e.created_at).format('YYYY-MM-DD'),
      "Last Followup": e.last_interaction_date ? dayjs(e.last_interaction_date).format('YYYY-MM-DD HH:mm') : "None",
      "Assigned Trainer": e.trainer_name || "Unassigned",
      "Updated By": e.updated_by || "Admin"
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Followup_Enquiries");
    XLSX.writeFile(wb, `Followup_Enquiries_${dayjs().format('YYYY-MM-DD')}.xlsx`);
    toast.success("Data Exported Successfully!");
  };

  const downloadExcelTemplate = () => {
    const template = [
      {
        "Lead Name": "John Doe",
        "Mobile Number": "9876543210",
        "Email": "john@example.com",
        "Organization": "ABC Corp",
        "Status": "pending",
        "Plan": "6 Months Pro Plan",
        "Gender": "Male",
        "DOB": "1995-05-15",
        "Message": "Interested in strength training",
        "Referred By": "Social Media"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads_Template");
    XLSX.writeFile(wb, "Followup_Enquiry_Template.xlsx");
    toast.success("Template Downloaded!");
  };

  // Filters
  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch =
      enquiry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.phone?.includes(searchTerm) ||
      enquiry.organization?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter;
    const isAdmin = role && role.toLowerCase().includes('admin');

    // Trainers see leads they updated OR leads assigned to them (by ID or Name)
    const matchesAccess = isAdmin ||
      (enquiry.updated_by === user?.username) ||
      (enquiry.trainer_name && (enquiry.trainer_name === user?.name || enquiry.trainer_name === user?.username)) ||
      (enquiry.trainer_id && currentStaff && Number(enquiry.trainer_id) === Number(currentStaff.id));

    let matchesStaff = true;
    if (isAdmin && staffFilter !== 'all') {
      matchesStaff = (enquiry.updated_by || 'Admin') === staffFilter;
    }

    let matchesAssignedTrainer = true;
    if (assignedTrainerFilter !== 'all') {
      matchesAssignedTrainer = enquiry.trainer_name === assignedTrainerFilter;
    }

    if (!matchesSearch || !matchesStatus || !matchesAccess || !matchesStaff || !matchesAssignedTrainer) return false;
    if (dateRange.type === 'All Time') return true;
    return filterByDateRange([enquiry], 'created_at', dateRange.type, dateRange.range).length > 0;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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

  const getStaffRole = (username) => {
    if (!username || username === 'Admin') return 'Admin';
    const staff = trainers.find(s => (s.username || s.name) === username);
    return staff ? staff.role : '';
  };

  return (
    <>
      {/* Main Container */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* IMPORT ERRORS SUMMARY */}
        {importErrors.length > 0 && (
          <div className="mx-4 sm:mx-0 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-red-500 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                <Trash2 size={16} /> Import Failures ({importErrors.length})
              </h3>
              <button onClick={() => setImportErrors([])} className="text-white/40 hover:text-white text-xs">Clear</button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
              {importErrors.map((err, i) => (
                <p key={i} className="text-white/60 text-xs flex justify-between gap-4">
                  <span className="font-medium">{err.name}</span>
                  <span className="text-red-400/80 italic">{err.reason}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Header Area */}
        <div className="p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Search */}
            <div className="relative group w-full lg:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500/50 outline-none w-full lg:w-72 transition-all placeholder:text-white/20"
              />
            </div>

            <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            {/* Status Filter */}
            <div className="relative inline-block text-left">
              <button
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl border border-white/10 transition-all backdrop-blur-md"
              >
                <Clock className="text-orange-500 w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {statusFilter === 'all' ? 'All Status' : statusFilter}
                </span>
                <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStatusOpen && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setIsStatusOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0f172a] border border-white/10 shadow-2xl z-[100] p-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                    {[
                      { id: 'all', label: 'All Status', icon: <Users size={14} /> },
                      { id: 'pending', label: 'Pending', icon: <Clock size={14} /> },
                      { id: 'followup', label: 'Followup', icon: <RefreshCcw size={14} /> },
                      { id: 'completed', label: 'Completed', icon: <CheckCircle size={14} /> },
                      { id: 'cancelled', label: 'Cancelled', icon: <XCircle size={14} /> },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setStatusFilter(option.id);
                          setCurrentPage(1);
                          setIsStatusOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          statusFilter === option.id 
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {option.icon}
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Staff Filter (Updated By) */}
            {role === 'admin' && (
              <div className="relative inline-block text-left">
                <button
                  onClick={() => setIsStaffOpen(!isStaffOpen)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl border border-white/10 transition-all backdrop-blur-md"
                >
                  <User className="text-orange-500 w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest truncate max-w-[100px]">
                    {staffFilter === 'all' ? 'All Staff' : staffFilter}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${isStaffOpen ? 'rotate-180' : ''}`} />
                </button>

                {isStaffOpen && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setIsStaffOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0f172a] border border-white/10 shadow-2xl z-[100] p-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                      {[
                        { id: 'all', label: 'All Staff', icon: <Users size={14} /> },
                        { id: 'Admin', label: 'Admin', icon: <User size={14} /> },
                        ...trainers.map(s => ({ id: s.username || s.name, label: s.name || s.username, icon: <User size={14} /> }))
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setStaffFilter(option.id);
                            setCurrentPage(1);
                            setIsStaffOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            staffFilter === option.id 
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                              : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {option.icon}
                          <span className="truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white'}`}
                  title="Table View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white'}`}
                  title="Card View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                </button>
              </div>

              {/* Excel Actions */}
              <div className="flex items-center gap-2">
                <label className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl cursor-pointer transition-all flex items-center gap-2" title="Import from Excel">
                  <FileText size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden xl:block">Import</span>
                  <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelImport} />
                </label>
                <button
                  onClick={exportToExcel}
                  className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all shadow-lg"
                  title="Export Excel"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            <button
              onClick={() => { setSelectedEnquiry(null); setShowForm(true); }}
              className="flex-1 lg:flex-none px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-600 text-white rounded-md font-bold text-md shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 p-2 overflow-hidden">

          {/* MOBILE VIEW (Always Cards one-by-one) */}
          <div className="lg:hidden flex-1 overflow-y-auto custom-scrollbar pb-20">
            {paginatedEnquiries.length > 0 ? (
              <div className="flex flex-col gap-4">
                {paginatedEnquiries.map((enquiry) => (
                  <div
                    key={enquiry.id}
                    onClick={() => { setSelectedEnquiry(enquiry); setShowForm(true); }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 active:scale-[0.98] transition-all flex flex-col gap-3 shadow-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white font-black text-sm">
                          {enquiry.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-black text-sm">{enquiry.name}</p>
                          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{enquiry.organization || 'Direct'}</p>
                        </div>
                      </div>
                      {getStatusBadge(enquiry.status)}
                    </div>

                    {enquiry.plan_name && (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2 flex items-center justify-between">
                        <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{enquiry.plan_name}</span>
                        {enquiry.plan_price && <span className="text-[10px] font-black text-white/60">₹{enquiry.plan_price}</span>}
                      </div>
                    )}

                  
                    {enquiry.message && (
                      <p className="text-white/50 text-[11px] line-clamp-3 mt-1">{enquiry.message}</p>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                        <Phone size={10} className="text-orange-500" /> {enquiry.phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                        <Mail size={10} className="text-orange-500" /> {enquiry.email || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                        <Calendar size={10} className="text-orange-500" /> {enquiry.next_followup_date ? dayjs(enquiry.next_followup_date).format('DD/MM/YY') : 'No follow-up'}
                      </div>
                      <div className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                        <span className="uppercase tracking-[0.2em]">{enquiry.status || 'pending'}</span>
                      </div>
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

          {/* DESKTOP VIEW (Toggleable) */}
          <div className="hidden lg:flex flex-1 flex-col min-h-0">
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
                          {enquiry.subject && (
                            <p className="text-white/60 text-[11px] mt-3">Subject: {enquiry.subject}</p>
                          )}
                          {enquiry.message && (
                            <p className="text-sm text-gray-300 mt-2 line-clamp-3">{enquiry.message}</p>
                          )}
                          <div className="mt-3 space-y-2 text-[11px] text-white/50">
                            {enquiry.location && (
                              <div className="flex items-center gap-2">
                                <MapPin size={12} className="text-orange-500" /> {enquiry.location}
                              </div>
                            )}
                            {enquiry.referred_by && (
                              <div className="flex items-center gap-2">
                                <Target size={12} className="text-orange-500" /> Referred by {enquiry.referred_by}
                              </div>
                            )}
                          </div>
                          {enquiry.plan_name && (
                            <div className="mt-3 flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1 w-fit">
                              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{enquiry.plan_name}</span>
                              {enquiry.plan_price && <span className="text-[10px] font-black text-white/60 border-l border-white/10 pl-2">₹{enquiry.plan_price}</span>}
                            </div>
                          )}
                        </div>

                        {/* Card Footer */}
                        <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-white/5">
                          <span className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                            <Phone size={10} className="text-orange-500" /> {enquiry.phone || 'N/A'}
                          </span>
                          <span className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                            <Mail size={10} className="text-orange-500" /> {enquiry.email || 'N/A'}
                          </span>
                          <span className="flex items-center gap-2 text-white/50 text-[10px] font-bold">
                            <Calendar size={10} className="text-orange-500" /> Next: {enquiry.next_followup_date ? dayjs(enquiry.next_followup_date).format('DD/MM/YY') : 'Not set'}
                          </span>
                          {enquiry.trainer_name && (
                            <span className="flex items-center gap-2 text-orange-400 text-[10px] font-bold">
                              <Users size={10} className="text-orange-500" /> Trainer: {enquiry.trainer_name}
                            </span>
                          )}
                          <span className="text-white/30 text-[9px] uppercase tracking-widest mt-1">
                            {dayjs(enquiry.created_at).format('MMM DD, YYYY')} • Updated by {enquiry.updated_by || 'Admin'} ({getStaffRole(enquiry.updated_by)})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedEnquiry(enquiry); setShowForm(true); }}
                            className="flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-white/5 border border-white/10 text-white/50 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all"
                          >
                            Edit
                          </button>
                          {enquiry.status === 'pending' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveToMembers(enquiry); }}
                              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-green-400 hover:border-green-400/50 transition-all"
                              title="Move to Members"
                            >
                              <Users size={12} />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteEnquiry(enquiry.id); }}
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
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
          <table className="w-full min-w-[700px] text-base text-gray-200">
            <thead className="bg-white/10 text-white">
                    <tr>
                      <th className="px-4 py-4 text-center text-sm font-semibold whitespace-nowrap">S.No</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Name</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Mobile</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Organization</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Plan</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Date</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Message</th>
                     
                      <th className="px-4 py-4 text-left text-sm font-semibold">Next Follow-up</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Assigned Trainer</th>
                      <th className="px-4 py-4 text-left text-sm font-semibold">Last Updated By</th>
                      <th className="px-4 py-4 text-right text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {loading ? (
                      <tr><td colSpan="12" className="py-32 text-center"><div className="animate-spin w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full mx-auto" /></td></tr>
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
                          <td className="px-4 py-4 text-base text-gray-400 text-center">
                            {(currentPage - 1) * itemsPerPage + paginatedEnquiries.indexOf(enquiry) + 1}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-white font-medium text-base group-hover:text-orange-400 transition-colors truncate max-w-[150px]">
                                {enquiry.name}
                              </span>
                              <span className="flex items-center gap-1 text-gray-400 text-sm font-medium truncate max-w-[150px]">
                                {enquiry.email || 'No Email'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="flex items-center gap-1 text-gray-300 text-base font-medium">
                              {enquiry.phone || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-base text-gray-300 truncate max-w-[100px]">
                            {enquiry.organization || enquiry.employer || 'Direct'}
                          </td>

                           <td className="px-4 py-4">
                            {enquiry.plan_name ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white truncate max-w-[120px]">{enquiry.plan_name}</span>
                                {enquiry.plan_price && <span className="text-xs font-semibold text-orange-400">₹{enquiry.plan_price}</span>}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500 italic">No Plan</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(enquiry.status)}
                          </td>
                         
                          <td className="px-4 py-4 text-sm text-gray-300 font-medium">
                            {dayjs(enquiry.created_at).format('DD/MM/YY')}
                          </td>
                           <td className="px-4 py-4 text-sm text-gray-300 truncate max-w-[160px]">
                            {enquiry.message ? enquiry.message : 'No message'}
                          </td>
                         
                          
                          <td className="px-4 py-4 text-sm text-gray-300 font-medium">
                            {enquiry.next_followup_date ? dayjs(enquiry.next_followup_date).format('DD/MM/YY') : '—'}
                          </td>
                          <td className="px-4 py-4">
                            {enquiry.trainer_name ? (
                              <div className="flex items-center gap-2 text-orange-400 font-medium text-sm">
                                <Users size={14} className="text-orange-500" />
                                <span className="truncate max-w-[100px]">{enquiry.trainer_name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500 italic text-sm">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-300 truncate max-w-[80px]">{enquiry.updated_by || 'Admin'}</span>
                              <span className="text-xs text-gray-500 uppercase font-semibold">{getStaffRole(enquiry.updated_by)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedEnquiry(enquiry); setShowForm(true); }}
                                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-blue-400 hover:border-blue-400/50 transition-all"
                                  title="View"
                                >
                                  <Eye size={14} />
                                </button>
                                {enquiry.status === 'pending' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleMoveToMembers(enquiry); }}
                                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-green-400 hover:border-green-400/50 transition-all"
                                    title="Move to Members"
                                  >
                                    <Users size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedEnquiry(enquiry); setShowForm(true); }}
                                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-orange-500 hover:border-orange-500/50 transition-all"
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteEnquiry(enquiry.id); }}
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
                        <td colSpan="12" className="py-32 text-center">
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
          </div>

          {/* Footer / Pagination */}
          {filteredEnquiries.length > 0 && (
            <div className="p-3 border-t border-white/5 bg-white/5 backdrop-blur-xl flex items-center justify-between mt-auto rounded-b-xl">
              <div className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">
                Showing {paginatedEnquiries.length} of {filteredEnquiries.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-orange-500 hover:border-orange-500/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg border transition-all text-[10px] font-black ${currentPage === i + 1
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-orange-500 hover:border-orange-500/50 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
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
                      <label className="text-xs font-bold text-white/60">Work Mobile</label>
                      <input
                        type="tel"
                        value={formData.emergency_contact_phone_work}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_phone_work: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        maxLength={10}
                        placeholder="e.g., 9876543210"
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

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Next Follow-up</label>
                      <input
                        type="date"
                        value={formData.next_followup_date}
                        onChange={(e) => setFormData({ ...formData, next_followup_date: e.target.value })}
                        className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none text-xs"
                      />
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
                            value={formData.phone || ""}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            maxLength={10}
                            placeholder="Secondary contact..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none"
                          />
                          <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-red-500 font-bold">*</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Select Trainer</label>
                      <div className="col-span-2 relative">
                        <select
                          value={formData.trainer_id || ""}
                          onChange={(e) => {
                            const selectedTrainer = trainers.find(t => t.id.toString() === e.target.value);
                            setFormData({
                              ...formData,
                              trainer_id: e.target.value,
                              trainer_name: selectedTrainer ? (selectedTrainer.name || selectedTrainer.username) : ""
                            });
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none appearance-none"
                        >
                          <option value="">[SELECT TRAINER]</option>
                          {trainers.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name || t.username} ({t.role || 'Staff'})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-4">
                      <label className="text-xs font-bold text-white/60">Status</label>
                      <select
                        value={formData.status || "pending"}
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
                        value={formData.plan_name || ""}
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
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Activity Date</label>
                            <input
                              type="datetime-local"
                              value={followupFormData.interaction_date}
                              onChange={(e) => setFollowupFormData({ ...followupFormData, interaction_date: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-orange-500/50 transition-all"
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
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                                      {dayjs(f.interaction_date).format('MMM DD, YYYY - HH:mm')}
                                    </span>
                                    {f.staff_name && (
                                      <span className="text-[8px] font-bold text-white/30 uppercase tracking-tight">By: {f.staff_name}</span>
                                    )}
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${f.status === 'completed' ? 'border-green-500/50 text-green-500' :
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
