import React, { useEffect, useState } from "react";
import { Trash2, Pencil, Plus, Printer, ChevronLeft, ChevronRight, ChevronDown, Clock, CheckCircle, LayoutGrid, List, Search, Users, Mail, Phone, Calendar, Eye, Download, Import, CreditCard, Zap } from "lucide-react";
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

const formatDobToDDMMYYYY = (dateString) => {
  if (!dateString || dateString.includes('0000-00-00') || dateString.includes('1899')) return "-";
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) return dateString;
  const parsed = dayjs(dateString);
  if (parsed.isValid()) return parsed.format("DD-MM-YYYY");
  return dateString;
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
  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get("search") || "";
  const [search, setSearch] = useState(querySearch);
  const [members, setMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });
  const [filterType, setFilterType] = useState("all"); // all, withPlan, withoutPlan
  const [selectedTrainer, setSelectedTrainer] = useState("all");
  const [trainerOptions, setTrainerOptions] = useState([]);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  useEffect(() => {
    setSearch(querySearch);
  }, [querySearch]);
  const [loading, setLoading] = useState(false);
  const [importErrors, setImportErrors] = useState([]);
  const [viewMode, setViewMode] = useState("table"); // table, card
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.includes("/trainer") ? "/trainer" : "/admin";
  const { user, role } = useAuth();
  const isTrainer = role === "trainer" || location.pathname.startsWith("/trainer");
  const [ptViewMemberId, setPtViewMemberId] = useState(null);
  const [isPtModalOpen, setIsPtModalOpen] = useState(false);

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
    if (filterType === "withPlan") matchesPlanFilter = hasPlan;
    if (filterType === "withoutPlan") matchesPlanFilter = !hasPlan;

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
            onClick={() => navigate(`${basePath}/pt-form`)}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-semibold text-white
            bg-white/10 border border-white/20 hover:bg-white/20 transition-all shadow-lg whitespace-nowrap flex-1 sm:flex-none"
          >
            <Calendar size={16} className="text-orange-500" />
            PT Form
          </button>



          <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />

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
            onClick={() => navigate(`${basePath}/addmembers`)}
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
            onClick={() => navigate(`${basePath}/buyplanadmin`)}
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
                <th className="px-4 py-5 text-left text-sm font-semibold">Mobile Number</th>
                {/* <th className="px-4 py-5 text-left text-sm font-semibold">Email</th> */}
                <th className="px-4 py-5 text-left text-sm font-semibold">Plan</th>
                <th className="px-4 py-5 text-left text-sm font-semibold">PT Plan</th>
                <th className="px-4 py-5 text-left text-sm font-semibold">Normal Validity</th>
                <th className="px-4 py-5 text-left text-sm font-semibold">PT Validity</th>
                <th className="px-4 py-5 text-left text-sm font-semibold">PT Form</th>
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
                    <td className="px-4 py-5 font-medium text-white">{m.name || "N/A"}</td>
                    <td className="px-4 py-5">
                      <div className="font-medium text-gray-300">{m.phone || "N/A"}</div>
                    </td>


                    <td className="px-4 py-5">
                      <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-orange-500/20 text-orange-400">
                        {m.plan || m.role || "Member"}
                      </span>
                    </td>
                    <td className="px-4 py-5">
                      {m.pt_plan ? (
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-400">
                          ✓ {m.pt_plan}
                        </span>
                      ) : m.has_pt_plan ? (
                        <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-400">
                          ✓ PT Plan
                        </span>
                      ) : (
                        <span className="text-white/30 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-5 text-white/70 text-xs font-medium">
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
                    <td className="px-4 py-5 text-white/70 text-xs font-medium">
                      <div className="flex flex-col gap-2">
                        {m.pt_plan ? (() => {
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
                      {!hasActiveOrPendingPlan(m) ? (
                        <span className="text-white/30">-</span>
                      ) : m.pt_form_completed ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-emerald-500 font-bold">
                            <CheckCircle size={16} />
                            <span className="text-[10px] uppercase">Done</span>
                          </div>
                          <button
                            onClick={() => {
                              setPtViewMemberId(m.id || m.member_id);
                              setIsPtModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition shadow-sm"
                            title="View PT Form"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`${basePath}/pt-form?member_id=${m.id || m.member_id}`)}
                          className="flex items-center gap-1 text-orange-400"
                        >
                          <Clock size={16} />
                          <span className="text-[10px] uppercase font-bold">
                            Pending
                          </span>
                        </button>
                      )}
                    </td>



                    <td className="px-4 py-5 flex gap-2">
                      <button
                        onClick={() => navigate(`${basePath}/member_details/${m.id || m.member_id}`)}
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
                              if (enabled) navigate(`${basePath}/buyplanadmin`, { state: { member: m } });
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
                      {!isTrainer && canChangePlan(m) && (
                        <button
                          onClick={() => navigate(`${basePath}/buyplanadmin`, { state: { member: m, forceChange: true } })}
                          className="p-2 rounded-lg bg-violet-500/80 hover:bg-violet-500 text-white transition"
                          title="Change Plan"
                        >
                          <Zap size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (m.source === "users") {
                            navigate(`${basePath}/addmembers?user_id=${m.u_id}`);
                          } else {
                            navigate(`${basePath}/addmembers/${m.id}`);
                          }
                        }}
                        className="p-2 rounded-lg bg-yellow-500/80 hover:bg-yellow-500 text-white transition"
                        title={m.source === "users" ? "Convert to Gym Member" : "Edit Member"}
                      >
                        <Pencil size={16} />
                      </button>
                      {role !== "trainer" && (
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition"
                          title="Delete Member"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
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
                        onClick={() => navigate(`${basePath}/member_details/${m.id || m.member_id}`)}
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
                              if (enabled) navigate(`${basePath}/buyplanadmin`, { state: { member: m } });
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
                          onClick={() => navigate(`${basePath}/buyplanadmin`, { state: { member: m, forceChange: true } })}
                          className="p-2 rounded-lg bg-violet-500/20 text-violet-500 hover:bg-violet-500 hover:text-white transition"
                          title="Change Plan"
                        >
                          <Zap size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (m.source === "users") {
                            navigate(`${basePath}/addmembers?user_id=${m.u_id}`);
                          } else {
                            navigate(`${basePath}/addmembers/${m.id}`);
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
                          {(hasActiveOrPendingPlan(m) && m.join_date) ? dayjs(m.join_date).format("DD-MM-YYYY") : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">End Date</p>
                        <p className="text-xs text-gray-300 font-medium">
                          {(hasActiveOrPendingPlan(m) && m.expiry_date) ? dayjs(m.expiry_date).format("DD-MM-YYYY") : "-"}
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
                          onClick={() => navigate(`${basePath}/pt-form?member_id=${m.id || m.member_id}`)}
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
                  onClick={() => navigate(`${basePath}/pt-form?member_id=${ptViewMemberId}`)}
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

    </div>
  );
};

export default Members;
