import React, { useEffect, useState } from "react";
import { Trash2, Pencil, Plus, Printer, ChevronLeft, ChevronRight, ChevronDown, Clock, CheckCircle, LayoutGrid, List, Search, Users, Mail, Phone, Calendar, Eye, Download, Import, CreditCard, Zap, Dumbbell, Utensils, X, Award, MoreHorizontal } from "lucide-react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";
import toast from "react-hot-toast";
import api from "../../api"
import cache from "../../cache";
import * as XLSX from "xlsx";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";
import AOS from "aos";
import "aos/dist/aos.css";
import dayjs from "dayjs";

import PTFormPreviewContent from "../PTForm/PTFormPreviewContent";

const getYouTubeEmbedUrl = (url) => {
  if (!url) return "";
  let videoId = "";
  if (url.includes("youtube.com/shorts/")) {
    videoId = url.split("shorts/")[1].split("?")[0];
  } else if (url.includes("youtube.com/watch?v=")) {
    videoId = url.split("v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
};

const formatDobToDDMMYYYY = (dateString) => {
  if (!dateString || dateString.includes('0000-00-00') || dateString.includes('1899')) return "-";
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) return dateString;
  const parsed = dayjs(dateString);
  if (parsed.isValid()) return parsed.format("DD-MM-YYYY");
  return dateString;
};

const formatDayLabel = (day) => {
  if (day == null) return "";
  const s = String(day);
  if (/^\d+$/.test(s)) return `Day ${parseInt(s, 10) + 1}`;
  const m = s.match(/^Day\s*(\d+)$/i) || s.match(/^Day(\d+)$/i);
  if (m) return `Day ${parseInt(m[1], 10)}`;
  return s;
};

const isUpdatePlanEnabled = (m) => {
  // If the member does not have an active plan, they need a plan
  if (!m.plan || m.plan === 'user' || m.status !== 'active') {
    return true;
  }
  // Allow renewal if expired or expiring within 5 days
  if (!m.expiry_date) return true;
  const days = dayjs(m.expiry_date).startOf('day').diff(dayjs().startOf('day'), "day");
  return days <= 5;
};

const hasActiveOrPendingPlan = (m) => {
  return !!(m.plan && m.plan !== 'user' && m.status === 'active');
};

const canChangePlan = (m) => {
  return !!(
    m.plan &&
    m.plan !== 'user' &&
    (m.status === 'active' || m.status === 'pending')
  );
};

const Members = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const querySearch = searchParams.get("search") || "";
  const queryTrainer = searchParams.get("trainer") || "all";
  const queryFilterType = searchParams.get("filterType") || "all";
  const queryViewMode = searchParams.get("viewMode") || "table";
  const queryPage = Number(searchParams.get("page")) || 1;
  const parseDateRangeFromParams = (params) => {
    const type = params.get("dateType") || "All Time";
    if (type === "Custom") {
      const start = params.get("start") || params.get("from") || null;
      const end = params.get("end") || params.get("to") || null;
      return {
        type,
        range: start && end ? { start, end } : null,
      };
    }
    return { type, range: null };
  };

  const [search, setSearch] = useState(querySearch);
  const [members, setMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(queryPage);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState(() => parseDateRangeFromParams(searchParams));
  const [filterType, setFilterType] = useState(queryFilterType); // all, withPlan, withoutPlan
  const [selectedTrainer, setSelectedTrainer] = useState(queryTrainer);
  const [trainerOptions, setTrainerOptions] = useState([]);
  const [viewMode, setViewMode] = useState(queryViewMode);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  useEffect(() => {
    const queryTrainer = searchParams.get("trainer") || "all";
    const queryFilterType = searchParams.get("filterType") || "all";
    const queryViewMode = searchParams.get("viewMode") || "table";
    const queryPage = Number(searchParams.get("page")) || 1;
    setSearch(searchParams.get("search") || "");
    setSelectedTrainer(queryTrainer);
    setFilterType(queryFilterType);
    setViewMode(queryViewMode);
    setCurrentPage(queryPage);
    setDateRange(parseDateRangeFromParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedTrainer !== "all") params.set("trainer", selectedTrainer);
    if (filterType !== "all") params.set("filterType", filterType);
    if (viewMode !== "table") params.set("viewMode", viewMode);
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (dateRange.type && dateRange.type !== "All Time") {
      params.set("dateType", dateRange.type);
      if (dateRange.type === "Custom" && dateRange.range) {
        if (dateRange.range.start) params.set("start", dateRange.range.start);
        if (dateRange.range.end) params.set("end", dateRange.range.end);
      }
    }
    setSearchParams(params, { replace: true });
  }, [search, selectedTrainer, filterType, viewMode, currentPage, dateRange, setSearchParams]);

  const [loading, setLoading] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.includes("/trainer") ? "/trainer" : "/admin";
  const { user, role } = useAuth();
  const isTrainer = role === "trainer" || location.pathname.startsWith("/trainer");
  const [ptViewMemberId, setPtViewMemberId] = useState(null);
  const [isPtModalOpen, setIsPtModalOpen] = useState(false);
  const [workoutMemberId, setWorkoutMemberId] = useState(null);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [workoutData, setWorkoutData] = useState([]);
  const [dietMemberId, setDietMemberId] = useState(null);
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [dietData, setDietData] = useState(null);
  const [dietTitle, setDietTitle] = useState("");
  const [activeDietDay, setActiveDietDay] = useState(null);
  const [expandedActionRow, setExpandedActionRow] = useState(null);

  const fetchTrainers = async () => {
    try {
      const res = await api.get("/users");
      const trainers = Array.isArray(res.data)
        ? res.data.filter((u) => String(u.role).toLowerCase() === "trainer")
        : [];
      setTrainerOptions(trainers);
    } catch (err) {
      console.error("Failed to load trainers", err);
    }
  };

  // 🔄 FETCH MEMBERS
  const fetchMembers = async () => {
    if (cache.adminMembers && selectedTrainer === "all") {
      setMembers(cache.adminMembers.filter((m) => m.source !== "users"));
    } else {
      setLoading(true);
    }

    try {
      let query = "/members";
      if (role === "trainer" && user?.id) {
        query = `/members?trainerUserId=${user.id}`;
      } else if (selectedTrainer !== "all") {
        query = `/members?trainerUserId=${selectedTrainer}`;
      }

      const res = await api.get(query);
      const data = Array.isArray(res.data) ? res.data : [];
      const onlyGymMembers = data.filter((m) => m.source !== "users");
      setMembers(onlyGymMembers);
      if (role !== "trainer" && selectedTrainer === "all") {
        cache.adminMembers = onlyGymMembers;
      }
    } catch {
      if (!cache.adminMembers) toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  // Close action dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (expandedActionRow !== null && !e.target.closest('.action-dropdown-wrapper')) {
        setExpandedActionRow(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedActionRow]);

  useEffect(() => {
    fetchTrainers();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [selectedTrainer, role, user]);

  // 🔎 SEARCH & DATE FILTER - Robust filtering
  const filtered = (members || []).filter((m) => {
    // 1. Text Search
    let matchesText = true;
    if (search) {
      const s = search.toLowerCase();
      matchesText = (
        String(m.name || "").toLowerCase().includes(s) ||
        String(m.username || "").toLowerCase().includes(s) ||
        String(m.phone || "").includes(s) ||
        String(m.mobile || "").includes(s) ||
        String(m.email || "").toLowerCase().includes(s) ||
        String(m.user_email || "").toLowerCase().includes(s) ||
        String(m.plan || "").toLowerCase().includes(s)
      );
    }

    if (!matchesText) return false;

    // 2. Plan Filter
    let matchesPlanFilter = true;
    const hasPlan = hasActiveOrPendingPlan(m);
    const hasPTPlan = Boolean(m.pt_plan) || Boolean(m.plan?.toLowerCase().includes("pt")) || Boolean(m.has_pt_plan);
    
    if (filterType === "withPlan") matchesPlanFilter = hasPlan;
    if (filterType === "withoutPlan") matchesPlanFilter = !hasPlan;
    if (filterType === "withPTPlan") matchesPlanFilter = hasPTPlan;
    if (filterType === "withoutPTPlan") matchesPlanFilter = !hasPTPlan;

    if (!matchesPlanFilter) return false;

    // 3. Date Range Filter
    return filterByDateRange([m], 'join_date', dateRange.type, dateRange.range).length > 0;
  });

  // 📄 PAGINATION
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleSearch = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  // 🗑 DELETE MEMBER
  const handleDelete = async (m) => {
    if (m.source === "users") {
      toast.error("Cannot delete a registered user from the Members page. Use User Management instead.");
      return;
    }

    const idToDelete = m.id || m.member_id;
    if (!idToDelete) {
      toast.error("Missing member identifier.");
      return;
    }

    if (!window.confirm(`Delete ${m.name || "this member"}?`)) return;

    try {
      await api.delete(`/members/${idToDelete}`);
      toast.success("Deleted successfully");
      fetchMembers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Delete failed");
    }
  };

  // 💪 FETCH AND DISPLAY WORKOUT DATA
  const handleOpenWorkout = (memberId) => {
    setWorkoutMemberId(memberId);
    setIsWorkoutModalOpen(true);
    fetchWorkoutData(memberId);
  };

  const fetchWorkoutData = async (memberId) => {
    try {
      const res = await api.get(`/workouts?memberId=${memberId}`);
      const workouts = Array.isArray(res.data) ? res.data : [];
      setWorkoutData(workouts);
    } catch (err) {
      console.error("Workout fetch error:", err);
      toast.error("Failed to load workout data");
      setWorkoutData([]);
    }
  };

  // 🍽 FETCH AND DISPLAY DIET DATA
  const handleOpenDiet = (memberId) => {
    setDietMemberId(memberId);
    setIsDietModalOpen(true);
    fetchDietData(memberId);
  };

  const fetchDietData = async (memberId) => {
    try {
      const res = await api.get(`/diet-plans?memberId=${memberId}`);
      const plans = Array.isArray(res.data) ? res.data : [];
      if (plans.length > 0) {
        const latestPlan = plans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        setDietTitle(latestPlan.title || "Diet Plan");
        let daysData = latestPlan.days;
        if (typeof daysData === "string") {
          daysData = JSON.parse(daysData);
        }
        setDietData(daysData);
        setActiveDietDay(Object.keys(daysData)[0]);
      } else {
        setDietData(null);
        setDietTitle("");
      }
    } catch (err) {
      console.error("Diet fetch error:", err);
      toast.error("Failed to load diet data");
      setDietData(null);
    }
  };

  /* ================= EXPORT TO EXCEL ================= */
  const exportToExcel = () => {
    if (members.length === 0) {
      toast.error("No members to export");
      return;
    }

    const dataToExport = members.map((m, index) => ({
      "Member ID": m.member_id || "-",
      Name: m.name || "N/A",
      "Mobile Number": m.phone || "N/A",
      Email: m.email || m.user_email || "-",
      Role: m.role || m.plan || "Member",
      Source: m.source === "users" ? "User" : "Gym Member",
      "Join Date": (hasActiveOrPendingPlan(m) && m.join_date) ? dayjs(m.join_date).format("YYYY-MM-DD") : "-",
      "Expiry Date": (hasActiveOrPendingPlan(m) && m.expiry_date) ? dayjs(m.expiry_date).format("YYYY-MM-DD") : "-",
      Status: m.status || "active",
      "Plan Price": m.price || "-",
      "Payment Status": m.paymentMode === 'emi' ? "Pending" : m.plan ? "Paid" : "N/A",
      "Remaining Amount": m.paymentMode === 'emi' ? (Number(m.price || 0) - Number(m.pricePaid || 0) - Number(m.secondPaymentPaid || 0)) : 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
    XLSX.writeFile(workbook, "members_directory.xlsx");
    toast.success("Exported successfully");
  };

  const downloadTemplate = () => {
    const template = [
      {
        "Full Name": "John Doe",
        "Mobile Number": "9876543210",
        "Email Address": "john@example.com",
        "Gender": "Male",
        "BMI": "22.9",
        "Plan": "Gold Plan",
        "Duration": "3",
        "Join Date": "2023-01-01",
        "Expiry Date": "2023-04-01",
        "Status": "active",
        "Home Address": "123 Street, City",
        "Additional Notes": "New member",
        "Password": "password123"
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Member_Import_Template.xlsx");
    toast.success("Template downloaded!");
  };

  /* ================= IMPORT FROM EXCEL ================= */
  const excelDateToJSDate = (value) => {
    if (!value) return null;

    // If it's a number, it's an Excel serial date
    if (typeof value === "number") {
      const date = new Date((value - 25569) * 86400 * 1000);
      return dayjs(date).format("YYYY-MM-DD");
    }

    // If it's a string, try to parse it with dayjs
    const parsed = dayjs(value);
    if (parsed.isValid()) {
      return parsed.format("YYYY-MM-DD");
    }

    return null;
  };

  const handleImport = async (e) => {
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
        console.log("Parsed Excel Data:", jsonData);

        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (const row of jsonData) {
          const email = row["Email Address"] || row.Email || row.email || "";
          const phone = String(row["Mobile Number"] || row["Phone Number"] || row.Phone || row.phone || row.Mobile || "");
          const name = row["Full Name"] || row.Name || row.name || "Unknown";

          const username = row.Username || row.username || (email ? email.split('@')[0] : name.replace(/\s+/g, '').toLowerCase());
          const joinDate = excelDateToJSDate(row["Join Date"] || row.joinDate || row["JoinDate"]);
          const duration = Number(row.Duration || row.duration || 0);

          // Calculate Expiry Date
          let expiryDate = row["Expiry Date"] || row.expiryDate || row["ExpiryDate"];
          if (!expiryDate && joinDate && duration) {
            const d = new Date(joinDate);
            d.setMonth(d.getMonth() + duration);
            expiryDate = d.toISOString().split("T")[0];
          } else if (expiryDate) {
            expiryDate = excelDateToJSDate(expiryDate);
          }

          // Calculate BMI
          let bmi = row.BMI || row.bmi || "";

          const payload = {
            name: name,
            username: username,
            phone: phone,
            email: email === "-" ? "" : email,
            gender: row.Gender || row.gender || "",
            bmi: bmi,
            plan: row.Plan || row.plan || "",
            duration: duration,
            joinDate: joinDate,
            expiryDate: expiryDate,
            status: row.Status || row.status || "active",
            address: row["Home Address"] || row.Address || row.address || "",
            notes: row["Additional Notes"] || row.Notes || row.notes || "",
            password: row.Password || row.password || phone || "123456",
            dob: excelDateToJSDate(row.DOB || row["Date of Birth"] || row.dob),
            age: row.Age || row.age || "",
            employer: row.Employer || row.employer || "",
            occupation: row.Occupation || row.occupation || "",
            emergency_contact_name: row["Emergency Contact Name"] || row.emergency_contact_name || "",
            emergency_contact_phone_home: row["Emergency Mobile"] || row["Emergency Phone"] || row.emergency_contact_phone || ""
          };

          try {
            await api.post("/members", payload);
            successCount++;
          } catch (rowErr) {
            const errorMsg = rowErr.response?.data?.message || rowErr.response?.data?.error || rowErr.message;
            console.error(`Import error for ${name || 'Unknown'}:`, errorMsg, rowErr.response?.data);
            errors.push({ name: name, reason: errorMsg });
            failCount++;
          }
        }

        setImportErrors(errors);
        if (successCount > 0) {
          toast.success(`Imported ${successCount} members successfully.`);
        }
        if (failCount > 0) {
          toast.error(`Failed to import ${failCount} rows. See summary below.`, { duration: 5000 });
        }

        fetchMembers();
      } catch (err) {
        console.error(err);
        toast.error("Import failed");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 🏋️ FETCH WORKOUTS
  const openWorkoutModal = async (memberId) => {
    setWorkoutMemberId(memberId);
    try {
      const res = await api.get(`/workouts?memberId=${memberId}`);
      const workouts = Array.isArray(res.data) ? res.data : [];
      setWorkoutData(workouts);
    } catch (err) {
      console.error("Error fetching workouts:", err);
      setWorkoutData([]);
    }
    setIsWorkoutModalOpen(true);
  };

  // 🥗 FETCH DIET
  const openDietModal = async (memberId, memberEmail) => {
    setDietMemberId(memberId);
    try {
      const res = await api.get(`/diet-plans?email=${encodeURIComponent(memberEmail)}`);
      const diets = Array.isArray(res.data) ? res.data : [];
      if (diets.length > 0) {
        const latestDiet = diets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        setDietTitle(latestDiet.title || "Diet Plan");
        let daysData = latestDiet.days;
        if (typeof daysData === "string") {
          try { daysData = JSON.parse(daysData); } catch (e) { daysData = null; }
        }
        setDietData(daysData);
        if (daysData) setActiveDietDay(Object.keys(daysData)[0]);
      } else {
        setDietData(null);
      }
    } catch (err) {
      console.error("Error fetching diet:", err);
      setDietData(null);
    }
    setIsDietModalOpen(true);
  };

  return (
    <div className="min-h-screen px-0 py-8 ">

      {/* IMPORT ERRORS SUMMARY */}
      {importErrors.length > 0 && (
        <div className="mx-4 sm:mx-0 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
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

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 px-4 sm:px-0">
        {/* 🔍 SEARCH */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search name or mobile"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        

        {/* ➕ ADD MEMBER + IMPORT/EXPORT */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* <button
            onClick={downloadTemplate}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold text-white
            bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex-1 sm:flex-none"
            title="Download Import Template"
          >
            <Download size={16} className="text-blue-500" />
            Template
          </button> */}

          {/* <button
            onClick={() => document.getElementById("importExcel").click()}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold text-white
            bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex-1 sm:flex-none"
          >
            <Import size={16} className="text-emerald-500" />
            Import
          </button> */}
          {/* <input
            type="file"
            id="importExcel"
            className="hidden"
            accept=".xlsx, .xls"
            onChange={handleImport}
          /> */}

          {/* <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold text-white
            bg-white/5 border border-white/10 hover:bg-white/20 transition-all flex-1 sm:flex-none"
          >
            <Download size={16} className="text-purple-500" />
            Export
          </button> */}

          {role !== "trainer" && (
            <div className="relative inline-flex items-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-5 py-2.5 transition-all duration-200 backdrop-blur-md min-w-[180px]">
              <span className="text-white text-sm font-semibold truncate">
                {selectedTrainer === 'all'
                  ? 'All Trainers'
                  : trainerOptions.find((trainer) => String(trainer.id) === String(selectedTrainer))?.name ||
                    trainerOptions.find((trainer) => String(trainer.id) === String(selectedTrainer))?.username ||
                    'All Trainers'}
              </span>
              <select
                value={selectedTrainer}
                onChange={(e) => {
                  setSelectedTrainer(e.target.value);
                  setCurrentPage(1);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="all">All Trainers</option>
                {trainerOptions.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name || trainer.username || trainer.email || `Trainer ${trainer.id}`}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/40">
                <ChevronDown size={18} />
              </div>
            </div>
          )}

          <button
            onClick={() => navigate(`${basePath}/pt-form`, { state: { returnUrl: location.pathname + location.search } })}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold text-white
            bg-white/10 border border-white/20 hover:bg-white/20 transition-all shadow-lg whitespace-nowrap flex-1 sm:flex-none"
          >
            <Calendar size={16} className="text-orange-500" />
            PT Form
          </button>



          <DateRangeFilter dateRange={dateRange} onRangeChange={(type, range) => setDateRange({ type, range })} />

          {/* 🖥 View Toggle */}
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/20 ml-0 sm:ml-2">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg transition ${viewMode === "card" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
                }`}
              title="Card View"
            >
              <LayoutGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition ${viewMode === "table" ? "bg-orange-500 text-white" : "text-gray-400 hover:text-white"
                }`}
              title="Table View"
            >
              <List size={20} />
            </button>
          </div>

          <button
            onClick={() => navigate(`${basePath}/addmembers`, { state: { returnUrl: location.pathname + location.search } })}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-white
            bg-gradient-to-r from-orange-500 to-orange-600
            hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap flex-1 sm:flex-none"
          >
            <Plus size={16} />
            Add Member
          </button>
        </div>
      </div>

      {/* 📑 TABS & ACTIONS */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8" data-aos="fade-up">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit mx-auto sm:mx-0">
          {[
            { id: 'all', label: 'All Members', icon: <Users size={16} /> },
            { id: 'withPlan', label: 'Active Plan', icon: <Calendar size={16} /> },
            { id: 'withoutPlan', label: 'No Plan', icon: <Mail size={16} /> },
            { id: 'withPTPlan', label: 'PT Plan Buy', icon: <Calendar size={16} /> },
            { id: 'withoutPTPlan', label: 'Not Buy PT', icon: <Mail size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterType(tab.id);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300
                ${filterType === tab.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105 z-10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-center lg:justify-end">
          <button
            onClick={() => navigate(`${basePath}/buyplanadmin`, { state: { returnUrl: location.pathname + location.search } })}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all shadow-lg whitespace-nowrap flex-1 sm:flex-none"
          >
            Buy Plan
          </button>

          <label className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-sm font-bold cursor-pointer hover:bg-indigo-500 hover:text-white transition-all shadow-lg whitespace-nowrap flex-1 sm:flex-none">
            Import Excel
            <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold hover:bg-emerald-500 hover:text-white transition-all shadow-lg whitespace-nowrap flex-1 sm:flex-none"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* DATA VIEW */}
      {viewMode === "table" ? (
        /* ================= TABLE VIEW ================= */
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
          <table className="w-full min-w-[700px] text-base text-gray-200">
            <thead className="bg-white/10 text-white">
              <tr>
                <th className="px-4 py-5 text-left text-sm font-semibold whitespace-nowrap">
                  Member ID
                </th>
                <th className="px-4 py-5 text-left text-sm font-semibold">Name</th>
                {/* <th className="px-4 py-5 text-left text-sm font-semibold">Email</th> */}
                <th className="px-4 py-5 text-left text-sm font-semibold whitespace-nowrap">Plan</th>
                <th className="px-4 py-5 text-left text-sm font-semibold whitespace-nowrap">PT Plan</th>
                <th className="px-4 py-5 text-left text-sm font-semibold whitespace-nowrap">Normal Validity</th>
                <th className="px-4 py-5 text-left text-sm font-semibold whitespace-nowrap">PT Validity</th>

                <th className="px-4 py-5 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="11" className="p-8 text-center text-gray-400">
                    {loading ? "Loading members..." : filtered.length === 0 ? "No records found" : "No data on this page"}
                  </td>
                </tr>
              ) : (
                paginatedData.map((m, index) => (
                  <tr key={m.id || `u-${m.u_id}`} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-5 font-medium text-gray-400">
                      {m.member_id || "-"}
                    </td>
                    <td className="px-4 py-5">
                      <div className="font-medium text-white">{m.name || "N/A"}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{m.phone || ""}</div>
                    </td>


                    <td className="px-4 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-orange-500/20 text-orange-400 inline-block whitespace-nowrap">
                        {m.plan || m.role || "Member"}
                      </span>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap">
                      {m.pt_plan ? (
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-400 inline-flex items-center gap-1 whitespace-nowrap">
                          ✓ {m.pt_plan}
                        </span>
                      ) : m.has_pt_plan ? (
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-400 inline-flex items-center gap-1 whitespace-nowrap">
                          ✓ PT Plan
                        </span>
                      ) : (
                        <span className="text-white/30 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-5 text-white/70 text-xs font-medium whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        {hasActiveOrPendingPlan(m) ? (() => {
                          const joinDateStr = m.join_date ? dayjs(m.join_date).format("DD-MM-YYYY") : "N/A";
                          const expiryDateStr = m.expiry_date ? dayjs(m.expiry_date).format("DD-MM-YYYY") : "N/A";
                          const daysLeft = m.expiry_date ? dayjs(m.expiry_date).startOf('day').diff(dayjs().startOf('day'), "day") : null;
                          const isExpired = daysLeft !== null && daysLeft <= 0;
                          return (
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10 w-max">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 self-center">
                                NRM
                              </span>
                              <div className="flex flex-col text-[11px] text-gray-300 gap-0.5">
                                <div><span className="text-gray-500 font-medium">S-</span> {joinDateStr}</div>
                                <div><span className="text-gray-500 font-medium">E-</span> {expiryDateStr}</div>
                              </div>
                              <div className="flex items-center ml-1 border-l border-white/10 pl-3">
                                {isExpired ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                                    EXPIRED
                                  </span>
                                ) : daysLeft !== null ? (
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${daysLeft > 10 ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"}`}>
                                    {daysLeft}D LEFT
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })() : <span className="text-white/30">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-5 text-white/70 text-xs font-medium whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        {m.pt_plan || m.pt_join_date || m.pt_expiry_date ? (() => {
                          const ptJoinDateStr = m.pt_join_date ? dayjs(m.pt_join_date).format("DD-MM-YYYY") : "N/A";
                          const ptExpiryDateStr = m.pt_expiry_date ? dayjs(m.pt_expiry_date).format("DD-MM-YYYY") : "N/A";
                          const isPtExpired = m.pt_expiry_date && dayjs(m.pt_expiry_date).startOf('day').diff(dayjs().startOf('day'), "day") <= 0;
                          const ptDays = m.pt_expiry_date ? dayjs(m.pt_expiry_date).startOf('day').diff(dayjs().startOf('day'), "day") : null;
                          return (
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10 w-max">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 self-center">
                                PT
                              </span>
                              <div className="flex flex-col text-[11px] text-gray-300 gap-0.5">
                                <div><span className="text-gray-500 font-medium">S-</span> {ptJoinDateStr}</div>
                                <div><span className="text-gray-500 font-medium">E-</span> {ptExpiryDateStr}</div>
                              </div>
                              <div className="flex items-center ml-1 border-l border-white/10 pl-3">
                                {isPtExpired ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                                    EXPIRED
                                  </span>
                                ) : ptDays !== null ? (
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${ptDays > 10 ? "bg-emerald-500/20 text-emerald-400" : "bg-purple-500/20 text-purple-400"}`}>
                                    {ptDays}D LEFT
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })() : <span className="text-white/30">-</span>}
                      </div>
                    </td>





                    <td className="px-4 py-5">
                      <div className="flex items-center gap-1.5 relative action-dropdown-wrapper">
                        {/* Primary actions - always visible */}
                        <button
                          onClick={() => navigate(`${basePath}/member_details/${m.id || m.member_id}`, { state: { returnUrl: location.pathname + location.search } })}
                          className="p-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 text-white transition"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {(() => {
                          const enabled = isUpdatePlanEnabled(m);
                          return (
                            <button
                              onClick={() => {
                                if (enabled) navigate(`${basePath}/buyplanadmin`, { state: { member: m, returnUrl: location.pathname + location.search } });
                              }}
                              disabled={!enabled}
                              className={`p-2 rounded-lg text-white transition ${enabled
                                  ? "bg-orange-500/80 hover:bg-orange-500 cursor-pointer"
                                  : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                                }`}
                              title={enabled ? "Update Plan" : "Can only renew 5 days before expiry"}
                            >
                              <CreditCard size={16} />
                            </button>
                          );
                        })()}
                        <button
                          onClick={() => navigate(`${basePath}/buy-pt-plan`, { state: { member: m, returnUrl: location.pathname + location.search } })}
                          className="p-2 rounded-lg bg-gradient-to-br from-purple-500/90 to-fuchsia-500/90 hover:from-purple-500 hover:to-fuchsia-500 text-white transition shadow-lg shadow-purple-500/20"
                          title="PT Plan Update"
                        >
                          <Award size={16} />
                        </button>

                        {/* Ellipsis toggle */}
                        <button
                          onClick={() => setExpandedActionRow(expandedActionRow === (m.id || m.member_id) ? null : (m.id || m.member_id))}
                          className={`p-2 rounded-lg text-white transition ${
                            expandedActionRow === (m.id || m.member_id)
                              ? "bg-white/20 ring-2 ring-white/30"
                              : "bg-white/10 hover:bg-white/20"
                          }`}
                          title="More Actions"
                        >
                          <MoreHorizontal size={16} />
                        </button>

                        {/* Dropdown menu */}
                        {expandedActionRow === (m.id || m.member_id) && (
                          <div className="absolute right-0 top-full mt-2 z-50 bg-[#1a1a2e] border border-white/20 rounded-xl shadow-2xl shadow-black/40 p-2 min-w-[180px] animate-in fade-in slide-in-from-top-2">
                            {!isTrainer && canChangePlan(m) && (
                              <button
                                onClick={() => { setExpandedActionRow(null); navigate(`${basePath}/buyplanadmin`, { state: { member: m, forceChange: true, returnUrl: location.pathname + location.search } }); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white hover:bg-violet-500/20 transition"
                              >
                                <Zap size={15} className="text-violet-400" />
                                Change Plan
                              </button>
                            )}
                            <button
                              onClick={() => { setExpandedActionRow(null); openWorkoutModal(m.id || m.member_id); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white hover:bg-green-500/20 transition"
                            >
                              <Dumbbell size={15} className="text-green-400" />
                              View Workout
                            </button>
                            <button
                              onClick={() => { setExpandedActionRow(null); openDietModal(m.id || m.member_id, m.email || m.user_email); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white hover:bg-amber-500/20 transition"
                            >
                              <Utensils size={15} className="text-amber-400" />
                              View Diet Plan
                            </button>
                            <button
                              onClick={() => {
                                setExpandedActionRow(null);
                                if (m.source === "users") {
                                  navigate(`${basePath}/addmembers?user_id=${m.u_id}`, { state: { returnUrl: location.pathname + location.search } });
                                } else {
                                  navigate(`${basePath}/addmembers/${m.id}`, { state: { returnUrl: location.pathname + location.search } });
                                }
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white hover:bg-yellow-500/20 transition"
                            >
                              <Pencil size={15} className="text-yellow-400" />
                              {m.source === "users" ? "Convert to Member" : "Edit Member"}
                            </button>
                            {role !== "trainer" && (
                              <>
                                <div className="border-t border-white/10 my-1"></div>
                                <button
                                  onClick={() => { setExpandedActionRow(null); handleDelete(m); }}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/20 transition"
                                >
                                  <Trash2 size={15} />
                                  Delete Member
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* ================= CARD VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedData.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-400 bg-white/5 border border-white/10 rounded-2xl">
              {loading ? "Loading..." : filtered.length === 0 ? "No records found" : "No data on this page"}
            </div>
          ) : (
            paginatedData.map((m, index) => (
              <div
                key={m.id || `u-card-${m.u_id}`}
                className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-6 hover:border-white/40 transition backdrop-blur-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                        <Users size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white line-clamp-1">{m.name || "N/A"}</p>
                        <p className="text-xs text-gray-400">
                          Member ID: #{m.member_id || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {m.pt_form_completed && (
                        <button
                          onClick={() => navigate(`${basePath}/pt-form/print/${m.id || m.member_id}`)}
                          className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition"
                          title="Print PT Form"
                        >
                          <Printer size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`${basePath}/member_details/${m.id || m.member_id}`, { state: { returnUrl: location.pathname + location.search } })}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white transition"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      {(() => {
                        const enabled = isUpdatePlanEnabled(m);
                        return (
                          <button
                            onClick={() => {
                              if (enabled) navigate(`${basePath}/buyplanadmin`, { state: { member: m, returnUrl: location.pathname + location.search } });
                            }}
                            disabled={!enabled}
                            className={`p-2 rounded-lg transition ${enabled
                                ? "bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white cursor-pointer"
                                : "bg-white/5 text-white/10 cursor-not-allowed border border-white/5"
                              }`}
                            title={enabled ? "Update Plan" : "Can only renew 5 days before expiry"}
                          >
                            <CreditCard size={14} />
                          </button>
                        );
                      })()}
                      {!isTrainer && canChangePlan(m) && (
                        <button
                          onClick={() => navigate(`${basePath}/buyplanadmin`, { state: { member: m, forceChange: true, returnUrl: location.pathname + location.search } })}
                          className="p-2 rounded-lg bg-violet-500/20 text-violet-500 hover:bg-violet-500 hover:text-white transition"
                          title="Change Plan"
                        >
                          <Zap size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => openWorkoutModal(m.id || m.member_id)}
                        className="p-2 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white transition"
                        title="View Workout"
                      >
                        <Dumbbell size={14} />
                      </button>
                      <button
                        onClick={() => openDietModal(m.id || m.member_id, m.email || m.user_email)}
                        className="p-2 rounded-lg bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white transition"
                        title="View Diet Plan"
                      >
                        <Utensils size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (m.source === "users") {
                            navigate(`${basePath}/addmembers?user_id=${m.u_id}`, { state: { returnUrl: location.pathname + location.search } });
                          } else {
                            navigate(`${basePath}/addmembers/${m.id}`, { state: { returnUrl: location.pathname + location.search } });
                          }
                        }}
                        className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-white transition"
                        title={m.source === "users" ? "Convert to Gym Member" : "Edit Member"}
                      >
                        <Pencil size={14} />
                      </button>
                      {role !== "trainer" && (
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition"
                          title="Delete Member"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Phone size={14} className="text-orange-500" />
                      {m.phone || "No mobile"}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-300">
                      <Mail size={14} className="text-orange-500" />
                      <span className="truncate">{m.email || m.user_email || "No email"}</span>
                    </div>

                    {/* MEMBERSHIP DATES IN CARD VIEW */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Start Date</p>
                        <p className="text-xs text-gray-300 font-medium">
                          {m.join_date ? dayjs(m.join_date).format("DD-MM-YYYY") : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">End Date</p>
                        <p className="text-xs text-gray-300 font-medium">
                          {m.expiry_date ? dayjs(m.expiry_date).format("DD-MM-YYYY") : "-"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30">
                        {m.plan || m.role || "Member"}
                      </span>
                      {m.pt_plan ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30">
                          ✓ {m.pt_plan}
                        </span>
                      ) : m.has_pt_plan ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30">
                          ✓ PT Plan
                        </span>
                      ) : null}
                      {m.price && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                          ₹{m.price}
                        </span>
                      )}


                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <p className="text-[10px] text-gray-500 uppercase">PT Form:</p>
                      {m.pt_form_completed ? (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
                            <CheckCircle size={12} /> COMPLETED
                          </span>
                          <button
                            onClick={() => {
                              setPtViewMemberId(m.id || m.member_id);
                              setIsPtModalOpen(true);
                            }}
                            className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition"
                            title="View PT Form"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`${basePath}/pt-form?member_id=${m.id || m.member_id}`, { state: { returnUrl: location.pathname + location.search } })}
                          className="flex items-center gap-1 text-orange-400 hover:text-orange-500 text-[10px] font-bold underline decoration-dotted underline-offset-2"
                        >
                          <Clock size={12} /> PENDING
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/10 mt-4">
                  <div className="bg-white/5 rounded-xl p-2 border border-white/10 text-center">
                    <p className="text-[10px] text-gray-400 uppercase mb-1">Validity</p>
                    <div className="text-[10px] font-bold text-white flex flex-col">
                      {hasActiveOrPendingPlan(m) ? (
                        <>
                          <span>{m.join_date ? dayjs(m.join_date).format("DD/MM/YY") : "-"}</span>
                          <span className="text-gray-500">to</span>
                          <span>{m.expiry_date ? dayjs(m.expiry_date).format("DD/MM/YY") : "-"}</span>
                        </>
                      ) : (
                        <span className="text-white/30">-</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 border border-white/10 text-center flex flex-col justify-center items-center">
                    <p className="text-[10px] text-gray-400 uppercase mb-1">Remaining</p>
                    {(() => {
                      if (!hasActiveOrPendingPlan(m) || !m.expiry_date) return <span className="text-white/30">-</span>;
                      const days = dayjs(m.expiry_date).startOf('day').diff(dayjs().startOf('day'), "day");
                      if (days <= 0) {
                        return <span className="text-red-400 text-[10px] font-bold uppercase">Expired</span>;
                      }
                      return (
                        <span className={`text-[10px] font-bold uppercase ${days > 10 ? "text-emerald-400" : "text-orange-400"}`}>
                          {days} {days === 1 ? 'Day' : 'Days'}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 📄 PAGINATION UI */}
      {filtered.length > 0 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 py-6 border-t border-white/10">
          <div className="text-sm text-gray-400">
            Showing <span className="text-white font-medium">{startIndex + 1}</span> to{" "}
            <span className="text-white font-medium">
              {Math.min(startIndex + itemsPerPage, filtered.length)}
            </span>{" "}
            of <span className="text-white font-medium">{filtered.length}</span> members
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === pageNum
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110 z-10"
                      : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-400 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value={5} className="bg-gray-900">5</option>
              <option value={10} className="bg-gray-900">10</option>
              <option value={20} className="bg-gray-900">20</option>
              <option value={50} className="bg-gray-900">50</option>
              <option value={100} className="bg-gray-900">100</option>
              <option value={200} className="bg-gray-900">200</option>
              <option value={500} className="bg-gray-900">500</option>
            </select>
          </div>
        </div>
      )}

      {/* 📄 PT FORM VIEW MODAL */}
      {isPtModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1625] border border-white/10 w-full max-w-5xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Calendar size={20} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Personal Training Registration View</h3>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Member ID: #{ptViewMemberId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`${basePath}/pt-form?member_id=${ptViewMemberId}`, { state: { returnUrl: location.pathname + location.search } })}
                  className="p-2 bg-yellow-500/20 hover:bg-yellow-500 text-yellow-500 hover:text-white rounded-lg transition"
                  title="Edit PT Form"
                >
                  <Pencil size={20} />
                </button>
                <button
                  onClick={() => window.open(`${basePath}/pt-form/print/${ptViewMemberId}`, '_blank')}
                  className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition"
                  title="Open Print View"
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => setIsPtModalOpen(false)}
                  className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-white rounded-lg transition"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>
            </div>

            {/* Modal Content - Native Component View */}
            <div className="flex-1 overflow-y-auto bg-gray-100/50 p-4 sm:p-8 custom-scrollbar">
              <PTFormPreviewContent memberId={ptViewMemberId} />
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setIsPtModalOpen(false)}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏋️ WORKOUT MODAL */}
      {isWorkoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1625] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Dumbbell size={20} className="text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Workout Plan</h3>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Member ID: #{workoutMemberId}</p>
                </div>
              </div>
              <button
                onClick={() => setIsWorkoutModalOpen(false)}
                className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-white rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {workoutData && workoutData.length > 0 ? (
                <div className="space-y-4">
                  {workoutData.map((workout, idx) => {
                    // Normalize possible shapes: workout may be a single exercise object
                    // or an object like { time, items: [...] } (collection). Handle both safely.
                    const items = Array.isArray(workout.items)
                      ? workout.items
                      : Array.isArray(workout.exercises)
                      ? workout.exercises
                      : Array.isArray(workout.days)
                      ? workout.days
                      : workout.days && typeof workout.days === 'object'
                      ? Object.values(workout.days).flat()
                      : null;

                    if (items && items.length > 0) {
                      return (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <h4 className="text-lg font-bold text-white mb-2">{workout.name || workout.title || `Workout ${idx + 1}`}</h4>
                          <div className="space-y-2">
                            {items.map((it, i) => (
                              <div key={i} className="bg-white/2 p-3 rounded grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)] gap-3 items-start">
                                <div className="w-full md:w-28 h-20 bg-black/10 rounded overflow-hidden flex items-center justify-center border border-white/5">
                                  {it.media ? (
                                    it.media.includes('youtube.com') || it.media.includes('youtu.be') ? (
                                      <iframe
                                        src={getYouTubeEmbedUrl(it.media)}
                                        title={it.name || it.exerciseName || 'Preview'}
                                        className="w-full h-full border-0 pointer-events-none"
                                      />
                                    ) : it.media.match(/\.(mp4|webm|ogg)$/i) || it.media.startsWith('data:video') ? (
                                      <video src={it.media} className="w-full h-full object-cover" controls />
                                    ) : (
                                      <img src={it.media} alt={it.name || it.food || 'media'} className="w-full h-full object-cover" />
                                    )
                                  ) : (
                                    <div className="text-white/30 text-sm">No media</div>
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="font-semibold text-white">{it.name || it.exerciseName || it.food || `Item ${i + 1}`}</div>
                                      <div className="text-xs text-gray-400 mt-1">{it.notes && (typeof it.notes === 'string' ? it.notes : JSON.stringify(it.notes))}</div>
                                    </div>
                                   
                                  </div>

                                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-400">
                                    {it.time && <div><div className="text-white/40">Time</div><div className="text-white font-bold">{it.time}</div></div>}
                                    {it.sets && <div><div className="text-white/40">Sets</div><div className="text-white font-bold">{it.sets}</div></div>}
                                    {it.count && <div><div className="text-white/40">Reps/Count</div><div className="text-white font-bold">{it.count}</div></div>}
                                    {it.type && <div><div className="text-white/40">Type</div><div className="text-white font-bold">{it.type}</div></div>}
                                    {it.massGain && <div className="col-span-2"><div className="text-white/40">Muscle Type</div><div className="text-white font-bold">{it.massGain}</div></div>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    // Fallback: treat as single workout object
                    return (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <h4 className="text-lg font-bold text-white mb-2">{workout.exerciseName || workout.name || "Unnamed Exercise"}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-[120px_minmax(0,1fr)] gap-4">
                              <div className="w-full md:w-28 h-28 bg-black/10 rounded overflow-hidden flex items-center justify-center border border-white/5">
                                {workout.media ? (
                                  workout.media.includes('youtube.com') || workout.media.includes('youtu.be') ? (
                                    <iframe src={getYouTubeEmbedUrl(workout.media)} title={workout.exerciseName || workout.name} className="w-full h-full border-0 pointer-events-none" />
                                  ) : workout.media.match(/\.(mp4|webm|ogg)$/i) || workout.media.startsWith('data:video') ? (
                                    <video src={workout.media} className="w-full h-full object-cover" controls />
                                  ) : (
                                    <img src={workout.media} alt={workout.exerciseName || workout.name || 'exercise'} className="w-full h-full object-cover" />
                                  )
                                ) : (
                                  <div className="text-white/30 text-sm">No media</div>
                                )}
                              </div>

                              <div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                                  {workout.time && <div><div className="text-white/40">Time</div><div className="text-white font-bold">{workout.time}</div></div>}
                                  {workout.sets && <div><div className="text-white/40">Sets</div><div className="text-white font-bold">{workout.sets}</div></div>}
                                  {workout.count && <div><div className="text-white/40">Reps</div><div className="text-white font-bold">{workout.count}</div></div>}
                                  {workout.type && <div><div className="text-white/40">Type</div><div className="text-white font-bold">{workout.type}</div></div>}
                                  {workout.massGain && <div className="col-span-2"><div className="text-white/40">Muscle Type</div><div className="text-white font-bold">{workout.massGain}</div></div>}
                                </div>
                                {workout.notes && <div className="mt-3 text-white/80 text-sm">{typeof workout.notes === 'string' ? workout.notes : JSON.stringify(workout.notes)}</div>}
                              </div>
                            </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Dumbbell size={48} className="text-white/20 mb-3" />
                  <p className="text-white/40 text-sm">No workout plan assigned</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setIsWorkoutModalOpen(false)}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🥗 DIET MODAL */}
      {isDietModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1a1625] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Utensils size={20} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{dietTitle || "Diet Plan"}</h3>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Member ID: #{dietMemberId}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDietModalOpen(false)}
                className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-white rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {dietData ? (
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap mb-4">
                    {Object.keys(dietData).map((day) => (
                      <button
                        key={day}
                        onClick={() => setActiveDietDay(day)}
                        className={`px-4 py-2 rounded-lg font-bold text-sm transition ${
                          activeDietDay === day
                            ? "bg-amber-500 text-white"
                            : "bg-white/5 text-white/40 hover:bg-white/10"
                        }`}
                      >
                        {formatDayLabel(day)}
                      </button>
                    ))}
                  </div>

                  {activeDietDay && dietData[activeDietDay] && (
                    <div className="space-y-3">
                      {Object.entries(dietData[activeDietDay]).map(([time, meal], idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <h4 className="text-sm font-bold text-amber-400 mb-2 uppercase">{time}</h4>
                          {/* meal may be a string, an array, or an object like { time, items } */}
                          {typeof meal === 'string' ? (
                            <p className="text-white whitespace-pre-wrap">{meal}</p>
                          ) : Array.isArray(meal) ? (
                            <div className="space-y-2">
                              {meal.map((it, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <div className="text-white text-sm">{typeof it === 'string' ? it : it.food || it.name || JSON.stringify(it)}</div>
                                  <div className="text-sm text-gray-200">{(it.calories || it.kcal) ? `${it.calories || it.kcal} kcal` : ''}</div>
                                </div>
                              ))}
                              {/* total calories */}
                              <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-sm text-white/80">
                                <div>Total</div>
                                <div className="font-bold text-amber-400">{meal.reduce((s, it) => s + (parseInt(it.calories || it.kcal) || 0), 0)} kcal</div>
                              </div>
                            </div>
                          ) : meal && Array.isArray(meal.items) ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-white/40">Time</div>
                                {meal.time && <div className="text-sm font-semibold text-amber-400">{meal.time}</div>}
                              </div>
                              {meal.items.map((it, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <div className="text-white text-sm">
                                    <div className="font-semibold">{it.food || it.name || JSON.stringify(it)}</div>
                                    <div className="text-xs text-gray-400">Qty: <span className="text-white/80">{it.quantity ?? it.qty ?? '--'}</span></div>
                                  </div>
                                  <div className="text-sm text-emerald-400 font-bold">{(it.calories || it.kcal) ? `${it.calories || it.kcal} kcal` : '0 kcal'}</div>
                                </div>
                              ))}
                              {/* total calories */}
                              <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-sm text-white/80">
                                <div>Total</div>
                                <div className="font-bold text-amber-400">{meal.items.reduce((s, it) => s + (parseInt(it.calories || it.kcal) || 0), 0)} kcal</div>
                              </div>
                            </div>
                          ) : (
                            <pre className="text-white whitespace-pre-wrap">{JSON.stringify(meal)}</pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Utensils size={48} className="text-white/20 mb-3" />
                  <p className="text-white/40 text-sm">No diet plan assigned</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setIsDietModalOpen(false)}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-all shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Members;
