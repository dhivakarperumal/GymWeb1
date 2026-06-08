import React, { useEffect, useState } from "react";
import { Eye, Edit, X, Trash2, Search, ChevronDown, CreditCard, Plus, LayoutGrid, List, ChevronLeft, ChevronRight, FileDown, FileUp, Download, Upload, Phone } from "lucide-react";
import api from "../../api";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange } from "../utils/dateUtils";
import { useAuth } from "../../PrivateRouter/AuthContext";

const parseDecimal = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const normalizeText = (text) =>
  text?.toString().trim().toLowerCase().replace(/\s+/g, " ") || "";

const parseDuration = (value) => {
  if (value == null) return 0;

  const raw = value.toString().trim().toLowerCase();
  const numberMatch = raw.match(/(\d+(?:\.\d+)?)/);
  const amount = numberMatch ? Number(numberMatch[1]) : NaN;
  if (Number.isNaN(amount)) return 0;

  if (raw.includes("year")) return Math.round(amount * 12);
  if (raw.includes("month")) return Math.round(amount);
  if (raw.includes("week")) return Math.ceil((amount * 7) / 30);
  if (raw.includes("day")) return Math.ceil(amount / 30);

  return Number.isFinite(amount) ? Math.round(amount) : 0;
};

const formatDuesEntry = (due) => {
  const amount = parseDecimal(due?.amount || due?.amt || 0).toFixed(2);
  const collectedBy = due?.collectedBy || due?.collected_by || "Admin";
  const paymentId = due?.paymentId || due?.payment_id || "Cash";
  const collectedAt = due?.collectedAt || due?.collected_at || due?.createdAt || due?.date;
  const dateLabel = collectedAt ? new Date(collectedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) : "No date";
  return `₹${amount} · ${dateLabel} · ${collectedBy} · ${paymentId}`;
};

// Calculate next payment date based on the initial payment date or membership creation date
const calculateNextPaymentDate = (membership) => {
  // Get the base date - either paymentDate or createdAt
  const baseDate = membership.paymentDate
    ? new Date(membership.paymentDate)
    : membership.createdAt
      ? new Date(membership.createdAt)
      : new Date();

  // Add 30 days to the base date
  const nextDueDate = new Date(baseDate);
  nextDueDate.setDate(nextDueDate.getDate() + 30);

  return nextDueDate;
};

const EMIList = () => {
  const { user, role, profileName } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [updateAmount, setUpdateAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [updating, setUpdating] = useState(false);
  const [viewingDetails, setViewingDetails] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ type: "All Time", range: null });
  const [statusFilter, setStatusFilter] = useState("all");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [trainerFilter, setTrainerFilter] = useState("all");
  const [isTrainerOpen, setIsTrainerOpen] = useState(false);
  const [trainers, setTrainers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [assignmentMap, setAssignmentMap] = useState({});
  const [importErrors, setImportErrors] = useState([]);
  const [viewMode, setViewMode] = useState("table");

  const buildAssignmentMap = (assignmentsArray) =>
    assignmentsArray.reduce((acc, assignment) => {
      const userId = String(assignment.userId || assignment.user_id || assignment.uid || "");
      const planId = String(assignment.planId || assignment.plan_id || assignment.id || "");
      if (!userId || !planId) return acc;
      const key = `${userId}:${planId}`;
      if (!acc[key]) acc[key] = assignment;
      return acc;
    }, {});

  const getAssignmentForMembership = (membership) => {
    const userId = String(membership.userId || membership.user_id || membership.uid || "");
    const planId = String(membership.planId || membership.plan_id || membership.id || "");
    const key = `${userId}:${planId}`;
    const assignment = assignmentMap[key];
    if (assignment) return assignment;

    return (
      assignments.find(
        (assign) =>
          String(assign.userId || assign.user_id || assign.uid || "") === userId &&
          String(assign.planId || assign.plan_id || assign.id || "") === planId,
      ) ||
      assignments.find(
        (assign) => String(assign.userId || assign.user_id || assign.uid || "") === userId,
      ) ||
      null
    );
  };

  const getAssignedTrainerName = (membership) => {
    const assignment = getAssignmentForMembership(membership);
    return (
      assignment?.trainerName ||
      assignment?.trainer_name ||
      assignment?.trainer ||
      "Unassigned"
    );
  };

  const getAssignedTrainerId = (membership) => {
    const assignment = getAssignmentForMembership(membership);
    return assignment?.trainerId || assignment?.trainer_id || "";
  };

  useEffect(() => {
    const loadTrainers = async () => {
      try {
        const res = await api.get("/staff");
        const trainerUsers = Array.isArray(res.data)
          ? res.data.filter((u) => String(u.role).toLowerCase() === "trainer")
          : [];
        setTrainers(trainerUsers);
      } catch (err) {
        console.error("Failed to load trainer users", err);
      }
    };

    loadTrainers();
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const membershipsQuery = "/memberships";
        const assignmentsQuery =
          role === "trainer" && user?.id
            ? `/assignments?trainerUserId=${user.id}`
            : "/assignments";

        const [membershipsRes, plansRes, assignmentsRes] = await Promise.all([
          api.get(membershipsQuery),
          api.get("/plans"),
          api.get(assignmentsQuery),
        ]);

        const assignmentsRaw = Array.isArray(assignmentsRes.data)
          ? assignmentsRes.data
          : assignmentsRes.data?.data || assignmentsRes.data?.assignments || [];
        setAssignments(assignmentsRaw);
        setAssignmentMap(buildAssignmentMap(assignmentsRaw));

        const raw = Array.isArray(membershipsRes.data) ? membershipsRes.data : [];
        const normalized = raw.map((m) => {
          try {
            if (m && typeof m.dues === "string") {
              m.dues = JSON.parse(m.dues || "[]");
            }
          } catch (e) {
            m.dues = [];
          }
          if (!m.dues) m.dues = [];
          return m;
        });
        setMemberships(normalized);
        setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      } catch (err) {
        console.error("Failed to load EMI records", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trainerFilter, role, user]);

  const emiMemberships = memberships.filter((m) => m.paymentMode === "emi");

  // Filtering Logic
  const filteredEMIs = emiMemberships.filter((m) => {
    const matchesSearch =
      (m.userName || m.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.planName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.paymentId || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || m.status === statusFilter;

    // Date Range Filter
    const matchesDate = filterByDateRange([m], 'createdAt', dateRange.type, dateRange.range).length > 0;

    const assignedTrainerId = getAssignedTrainerId(m);
    const matchesTrainer =
      trainerFilter === "all" || String(assignedTrainerId) === String(trainerFilter);
    const matchesTrainerRole =
      role === "trainer" ? !!getAssignmentForMembership(m) : true;

    return matchesSearch && matchesStatus && matchesDate && matchesTrainer && matchesTrainerRole;
  });

  const paginatedEMIs = filteredEMIs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredEMIs.length / itemsPerPage);

  // Excel Functions
  const exportToExcel = () => {
    if (filteredEMIs.length === 0) {
      toast.error("No records to export");
      return;
    }

    const dataToExport = filteredEMIs.map((m, index) => {
      const plan = findPlanForMembership(m);
      const duration = parseDuration(m.duration) || 1;
      const totalPrice = m.price
        ? parseDecimal(m.price)
        : plan
          ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price)
          : parseDecimal(m.pricePaid) * duration;
      const initialPayment = parseDecimal(m.pricePaid);
      const secondPayment = parseDecimal(m.secondPaymentPaid);
      const balanceDue = Math.max(0, Number((totalPrice - initialPayment - secondPayment).toFixed(2)));

      return {
        "S.No": index + 1,
        Member: m.userName || m.username || "N/A",
        Email: m.userEmail || m.email || "-",
        Plan: m.planName || "N/A",
        Trainer: getAssignedTrainerName(m),
        Duration: `${duration} months`,
        "Initial Payment": `₹${initialPayment.toFixed(2)}`,
        "Second Payment": `₹${secondPayment.toFixed(2)}`,
        "Balance Due": `₹${balanceDue.toFixed(2)}`,
        "Total Price": `₹${totalPrice.toFixed(2)}`,
        "Payment ID": m.paymentId || "-",
        "Created At": new Date(m.createdAt).toLocaleDateString(),
        Status: m.status || "active",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "EMI Records");
    XLSX.writeFile(workbook, "emi_payments_report.xlsx");
    toast.success("EMI report exported!");
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

        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (const row of jsonData) {
          if (!row || Object.keys(row).length === 0) continue;

          // EMI import is complex because it involves memberships linked to users/plans
          // For now we assume a basic membership creation or update logic
          const username = row.Member || row.Username || row.username || "";
          const phone = (row.Phone || row.Mobile || "").toString().replace(/\D/g, '').slice(-10);

          if (!username || !phone || phone.length < 10) {
            errors.push({
              name: username || "Unknown Row",
              reason: !username ? "Missing Username" : "Invalid Phone"
            });
            failCount++;
            continue;
          }

          // In real EMI import, we'd need more data (planId, userId, etc.)
          // This is a placeholder for the logic if the user expands this feature
          try {
            // Placeholder for API call
            // await api.post("/memberships/emi-import", payload);
            // successCount++;
            errors.push({ name: username, reason: "Import logic not fully implemented for EMI" });
            failCount++;
          } catch (err) {
            errors.push({ name: username, reason: err.message });
            failCount++;
          }
        }

        setImportErrors(errors);
        if (successCount > 0) toast.success(`Successfully imported ${successCount} EMI records!`);
        if (failCount > 0) toast.error(`Failed to import ${failCount} records. See summary.`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to read Excel file");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const findPlanForMembership = (membership) => {
    return plans.find(
      (plan) =>
        normalizeText(plan.name) === normalizeText(membership.planName) &&
        parseDuration(plan.duration) === parseDuration(membership.duration),
    );
  };

  const selectMembership = (membership) => {
    setSelectedMembership(membership);
    setUpdateAmount("");
    setPaymentReference("");

    // Auto-fill remaining balance amount for 30-day payment plan
    const plan = findPlanForMembership(membership);
    const totalPrice = membership.price
      ? parseDecimal(membership.price)
      : plan
        ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price)
        : parseDecimal(membership.pricePaid) * parseDuration(membership.duration);
    const currentPaid = parseDecimal(membership.pricePaid);
    const secondPayment = parseDecimal(membership.secondPaymentPaid);
    const remaining = totalPrice - currentPaid - secondPayment;
    const suggested = remaining > 0 ? remaining.toFixed(2) : "0.00";
    setUpdateAmount(suggested);
  };

  const viewDetails = (membership) => {
    setViewingDetails(membership);
  };

  const handleUpdatePayment = async () => {
    if (!selectedMembership) return;

    const amount = parseDecimal(updateAmount);
    if (amount <= 0) {
      toast.error("Enter a valid payment amount");
      return;
    }

    const currentPaid = parseDecimal(selectedMembership.pricePaid);
    const currentSecondPayment = parseDecimal(selectedMembership.secondPaymentPaid);
    const totalPrice = (() => {
      if (selectedMembership.price) return parseDecimal(selectedMembership.price);
      const plan = findPlanForMembership(selectedMembership);
      return plan
        ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price)
        : currentPaid + currentSecondPayment;
    })();
    const newSecondPayment = Number((currentSecondPayment + amount).toFixed(2));
    const isFullyPaid = newSecondPayment + currentPaid >= totalPrice;
    const newStatus = isFullyPaid ? "active" : (selectedMembership.status || "active");
    const newPaymentStatus = isFullyPaid ? "Paid" : "Partial";

    setUpdating(true);
    try {
      await api.put(`/memberships/${selectedMembership.id}`, {
        secondPaymentPaid: newSecondPayment,
        // Include the discrete payment amount so server can append a dues entry
        paymentAmount: amount,
        paymentId: paymentReference || selectedMembership.paymentId,
        status: newStatus,
        paymentStatus: newPaymentStatus,
        collectedBy: profileName || "Admin",
      });

      let membershipsQuery = "/memberships";
      if (role === "trainer" && user?.id) {
        membershipsQuery = `/memberships?trainerUserId=${user.id}`;
      }
      const res = await api.get(membershipsQuery);
      const raw = Array.isArray(res.data) ? res.data : [];
      const normalized = raw.map((m) => {
        try {
          if (m && typeof m.dues === 'string') {
            m.dues = JSON.parse(m.dues || '[]');
          }
        } catch (e) {
          m.dues = [];
        }
        if (!m.dues) m.dues = [];
        return m;
      });
      setMemberships(normalized);
      setSelectedMembership(null);
      setUpdateAmount("");
      setPaymentReference("");
      toast.success("EMI payment details updated");
    } catch (err) {
      console.error("Failed to update membership payment:", err);
      toast.error("Unable to save payment update");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteMembership = async (id) => {
    if (!id) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this EMI record? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await api.delete(`/memberships/${id}`);
      setMemberships((prev) => prev.filter((item) => item.id !== id));
      if (selectedMembership?.id === id) {
        setSelectedMembership(null);
      }
      if (viewingDetails?.id === id) {
        setViewingDetails(null);
      }
      toast.success("EMI record deleted successfully");
    } catch (err) {
      console.error("Failed to delete EMI record:", err);
      toast.error("Unable to delete EMI record");
    }
  };

  const Card = ({ title, value, color = "text-white" }) => (
    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
      <p className="text-xs text-white/50">{title}</p>
      <p className={`font-bold ${color}`}>{value}</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4">
      {/* IMPORT ERRORS SUMMARY */}
      {importErrors.length > 0 && (
        <div className="mx-4 sm:mx-0 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-red-500 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <CreditCard size={16} /> EMI Import Failures ({importErrors.length})
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
      <div className="p-2 flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder="Search member, plan, ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500/50 outline-none w-72 transition-all placeholder:text-white/20"
            />
          </div>

          <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <div className="relative inline-block text-left">
            <button
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl border border-white/10 transition backdrop-blur-md min-w-[130px]"
            >
              <CreditCard className="text-orange-500" size={16} />
              <span className="text-sm font-medium uppercase tracking-wide">
                {statusFilter === 'all' ? 'All Status' : statusFilter}
              </span>
              <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
            </button>

            {isStatusOpen && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setIsStatusOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#1e293b] border border-white/10 shadow-2xl z-[100] p-2 overflow-hidden animate-in fade-in zoom-in duration-200">
                  {[
                    { id: 'all', label: 'All Status' },
                    { id: 'active', label: 'Active' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'expired', label: 'Expired' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setStatusFilter(option.id);
                        setCurrentPage(1);
                        setIsStatusOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${statusFilter === option.id
                          ? 'bg-orange-500 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {role !== "trainer" && (
            <div className="relative inline-flex items-center bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-4 py-2.5 transition-all duration-200 backdrop-blur-md min-w-[180px]">
              <span className="pointer-events-none text-white text-sm font-medium truncate">
                {trainerFilter === 'all'
                  ? 'All Trainers'
                  : trainers.find((trainer) => String(trainer.id) === String(trainerFilter))?.name ||
                  trainers.find((trainer) => String(trainer.id) === String(trainerFilter))?.username ||
                  'All Trainers'}
              </span>
              <select
                value={trainerFilter}
                onChange={(e) => {
                  setTrainerFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="all">All Trainers</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name || trainer.username || `Trainer ${trainer.id}`}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/40">
                <ChevronDown size={18} />
              </div>
            </div>
          )}

          {/* Import/Export */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-sm font-bold cursor-pointer hover:bg-indigo-500 hover:text-white transition-all shadow-lg">
              <Upload size={16} />
              Import
              <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
            </label>

            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm font-bold hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
            >
              <Download size={16} />
              Export
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-orange-500 text-white' : 'text-white/40 hover:text-white'}`}
              title="Table View"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-orange-500 text-white' : 'text-white/40 hover:text-white'}`}
              title="Card View"
            >
              <LayoutGrid size={20} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : filteredEMIs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-2xl">
          <div className="p-4 bg-white/5 rounded-full mb-4">
            <Search size={32} className="text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-300">No EMI records found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <>
          {viewMode === "table" ? (
            /* ================= TABLE VIEW ================= */
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm text-left text-gray-200 border-collapse whitespace-nowrap">
                <thead className="bg-white/10 text-white">
                  <tr>
                    <th className="px-4 py-4 text-center text-sm font-semibold whitespace-nowrap">S.No</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Member</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Phone</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Plan</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Trainer</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Dues</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Total Price</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Initial Payment</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Second Payment</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Remaining Due</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Created</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Next Payment</th>

                    <th className="px-4 py-4 text-left text-sm font-semibold">Payment</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEMIs.map((membership, idx) => {
                    const plan = findPlanForMembership(membership);
                    const duration = parseDuration(membership.duration) || 1;
                    const totalPrice = membership.price
                      ? parseDecimal(membership.price)
                      : plan
                        ? parseDecimal(
                          plan.finalPrice ?? plan.final_price ?? plan.price,
                        )
                        : parseDecimal(membership.pricePaid) * duration;
                    const initialPayment = parseDecimal(membership.pricePaid);
                    const secondPayment = parseDecimal(membership.secondPaymentPaid);
                    const remainingDue = Math.max(0, Number(
                      (totalPrice - initialPayment - secondPayment).toFixed(2),
                    ));
                    const dueDate = calculateNextPaymentDate(membership);
                    const paymentMethodLabel = membership.paymentId || "N/A";

                    const getPaymentStatusBadge = (status) => {
                      if (status === "Paid") return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Paid</span>;
                      if (status === "Pending") return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/20">Pending</span>;
                      if (status === "Partial") return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">Partial</span>;
                      return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-500/20 text-gray-400 border border-gray-500/20">{status || "--"}</span>;
                    };

                    return (
                      <tr
                        key={membership.id}
                        className="border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-4 text-center text-base font-medium text-gray-400">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-base text-white group-hover:text-orange-400 transition-colors">
                            {membership.userName || membership.username || "Unknown"}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-base font-medium text-gray-300">
                          {membership.mobile || membership.phone || "N/A"}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-base font-medium text-gray-300">{membership.planName}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-base font-medium text-cyan-300">{getAssignedTrainerName(membership)}</div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          {membership.dues && Array.isArray(membership.dues) && membership.dues.length > 0 ? (
                            <div className="space-y-1 text-[11px] leading-snug">
                              {membership.dues.slice(0, 3).map((due, dueIndex) => (
                                <div key={dueIndex} className="text-white/80">
                                  {formatDuesEntry(due)}
                                </div>
                              ))}
                              {membership.dues.length > 3 && (
                                <div className="text-xs text-white/50">
                                  +{membership.dues.length - 3} more dues
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-white/50">No dues recorded</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-base font-medium text-emerald-400">
                            ₹{totalPrice.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-base font-medium text-green-400">
                            ₹{initialPayment.toFixed(2)}
                          </div>
                          <div className="text-xs text-white/50">Paid today</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-base font-medium text-cyan-300">
                            ₹{secondPayment.toFixed(2)}
                          </div>
                          <div className="text-xs text-white/50">
                            {secondPayment > 0 ? `By: ${getAssignedTrainerName(membership)}` : "Second payment"}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-base font-medium text-blue-400">
                            {remainingDue <= 0 ? "₹0.00" : `₹${remainingDue.toFixed(2)}`}
                          </div>
                          <div className="text-xs text-white/50">
                            {remainingDue <= 0
                              ? "Completed"
                              : `Due ${dueDate.toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}`}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-base font-medium text-gray-300">
                          {new Date(membership.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-4">
                          {remainingDue > 0 ? (
                            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2 text-center">
                              <div className="text-base font-bold text-blue-300">
                                {dueDate.toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </div>
                              <div className="text-xs text-blue-400/70 mt-1">
                                {(() => {
                                  const today = new Date();
                                  const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                                  if (daysLeft < 0) return `Overdue by ${Math.abs(daysLeft)} days`;
                                  if (daysLeft === 0) return "Due today";
                                  if (daysLeft === 1) return "Due tomorrow";
                                  return `${daysLeft} days left`;
                                })()}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-white/50 text-center py-2">Paid</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {getPaymentStatusBadge(membership.paymentStatus)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center items-center gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); viewDetails(membership); }}
                              className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/20 text-blue-300 hover:bg-blue-500/40 transition"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>

                            {membership.paymentStatus !== "Paid" && (
                              <button
                                onClick={(e) => { e.stopPropagation(); selectMembership(membership); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 font-bold text-xs whitespace-nowrap"
                                title="Process Remaining Payment"
                              >
                                <CreditCard size={14} />
                                Pay
                              </button>
                            )}

                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteMembership(membership.id); }}
                              className="px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/20 text-red-300 hover:bg-red-500/30 transition text-xs font-semibold flex items-center justify-center gap-2"
                              title="Delete EMI record"
                            >
                              <Trash2 size={16} />
                          
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ================= CARD VIEW ================= */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedEMIs.map((membership, idx) => {
                const plan = findPlanForMembership(membership);
                const duration = parseDuration(membership.duration) || 1;
                const totalPrice = membership.price
                  ? parseDecimal(membership.price)
                  : plan
                    ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price)
                    : parseDecimal(membership.pricePaid) * duration;
                const initialPayment = parseDecimal(membership.pricePaid);
                const secondPayment = parseDecimal(membership.secondPaymentPaid);
                const balanceDue = Math.max(0, Number((totalPrice - initialPayment - secondPayment).toFixed(2)));
                const dueDate = calculateNextPaymentDate(membership);

                return (
                  <div
                    key={membership.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3 flex flex-col gap-2 items-end">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${membership.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'
                        }`}>
                        {membership.status || 'Active'}
                      </span>
                      {(() => {
                        const status = membership.paymentStatus;
                        if (status === "Paid") return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Paid</span>;
                        if (status === "Pending") return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/20">Pending</span>;
                        if (status === "Partial") return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">Partial</span>;
                        return null;
                      })()}
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center text-orange-500 font-bold">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-white line-clamp-1">{membership.userName || membership.username || "Unknown"}</h3>
                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-[11px] text-orange-400 font-bold flex items-center gap-1.5"><Phone size={12} />{membership.mobile || membership.phone || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                          <div className="w-full">
                            <p className="text-[10px] text-white/40 uppercase font-black tracking-wider text-center sm:text-left">Plan Details</p>
                            <p className="text-sm font-semibold text-white text-center sm:text-left">{membership.planName}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                          <div className="w-full">
                            <p className="text-[10px] text-white/40 uppercase font-black tracking-wider text-center sm:text-left">Assigned Trainer</p>
                            <p className="text-sm font-semibold text-cyan-300 text-center sm:text-left">{getAssignedTrainerName(membership)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-green-500/5 p-3 rounded-xl border border-green-500/10 text-center">
                          <p className="text-[10px] text-green-500/60 uppercase font-black tracking-wider mb-1">Initial Paid</p>
                          <p className="text-base font-bold text-green-400">₹{initialPayment.toFixed(2)}</p>
                        </div>
                        <div className="bg-cyan-500/5 p-3 rounded-xl border border-cyan-500/10 text-center">
                          <p className="text-[10px] text-cyan-500/60 uppercase font-black tracking-wider mb-1">Second Paid</p>
                          <p className="text-base font-bold text-cyan-300">₹{secondPayment.toFixed(2)}</p>
                          {secondPayment > 0 && (
                            <p className="text-[9px] text-white/40 mt-1 uppercase">By: {getAssignedTrainerName(membership)}</p>
                          )}
                        </div>
                        <div className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/10 text-center">
                          <p className="text-[10px] text-blue-500/60 uppercase font-black tracking-wider mb-1">Remaining</p>
                          <p className="text-base font-bold text-blue-400">₹{balanceDue.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="text-center py-2">
                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Total Value</p>
                        <p className="text-xl font-black text-orange-500">₹{totalPrice.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); viewDetails(membership); }}
                        className="flex-1 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Eye size={14} /> Details
                      </button>
                      {membership.paymentStatus !== "Paid" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); selectMembership(membership); }}
                          className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 text-xs"
                        >
                          <CreditCard size={14} /> Pay ₹{balanceDue.toFixed(0)}
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteMembership(membership.id); }}
                        className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-all text-xs font-semibold flex items-center justify-center gap-2"
                        title="Delete EMI record"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredEMIs.length > 0 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 py-6 border-t border-white/10 px-6">
              <div className="text-sm text-gray-400">
                Showing <span className="text-white font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                <span className="text-white font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredEMIs.length)}
                </span>{" "}
                of <span className="text-white font-medium">{filteredEMIs.length}</span> records
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === i + 1
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110 z-10"
                          : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
                        }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedMembership && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            onClick={() => setSelectedMembership(null)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-5xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden
        rounded-3xl border border-white/20
        bg-slate-950/95
        shadow-[0_30px_80px_rgba(0,0,0,0.6)] p-8"
            >
              <div className="flex items-start justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-white">
                    30-Day Payment Plan
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedMembership(null)}
                  className="rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Info Cards */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-orange-500/30 transition-all">
                  <p className="text-xs text-white/50 uppercase tracking-wide mb-2">
                    Plan
                  </p>
                  <p className="font-semibold text-white text-lg">
                    {selectedMembership.planName}
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    {selectedMembership.duration} months
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 p-4 rounded-xl border border-green-500/30">
                  <p className="text-xs text-green-400 uppercase tracking-wide font-semibold mb-2">
                    Already Paid
                  </p>
                  <p className="text-green-400 font-bold text-xl">
                    ₹{parseDecimal(selectedMembership.pricePaid).toFixed(2)}
                  </p>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-orange-500/30 transition-all">
                  <p className="text-xs text-white/50 uppercase tracking-wide mb-2">
                    Status
                  </p>
                  <p className="font-semibold text-white">
                    {selectedMembership.status || "active"}
                  </p>
                </div>
              </div>

              {/* Payment Plan Details */}
              <div className="bg-gradient-to-r from-blue-900/30 to-blue-900/10 p-6 rounded-2xl border border-blue-500/30 mb-6">
                <p className="text-blue-400 text-xs uppercase tracking-wide font-bold mb-4">
                  📋 Payment Schedule
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500/20 border border-green-500">
                        <span className="text-xs font-bold text-green-400">
                          ✓
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          Initial Payment (Today)
                        </p>
                        <p className="text-xs text-white/60">
                          Already collected {selectedMembership.referredBy || selectedMembership.collectedBy ? `by ${selectedMembership.referredBy || selectedMembership.collectedBy}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="text-green-400 font-bold text-lg">
                      ₹{parseDecimal(selectedMembership.pricePaid).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-blue-500/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500/20 border border-blue-500">
                        <span className="text-xs font-bold text-blue-400">
                          2
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          Remaining Balance (Due in 30 Days)
                        </p>
                        <p className="text-xs text-white/60">
                          Due by{" "}
                          {(() => {
                            const dueDate = new Date();
                            dueDate.setDate(dueDate.getDate() + 30);
                            return dueDate.toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            });
                          })()}
                        </p>
                      </div>
                    </div>
                    <p className="text-blue-400 font-bold text-lg">
                      ₹
                      {(() => {
                        const plan = findPlanForMembership(selectedMembership);
                        const totalPrice = selectedMembership.price
                          ? parseDecimal(selectedMembership.price)
                          : plan
                            ? parseDecimal(
                              plan.finalPrice ?? plan.final_price ?? plan.price,
                            )
                            : parseDecimal(selectedMembership.pricePaid) *
                            parseDuration(selectedMembership.duration);
                        return (
                          totalPrice -
                          parseDecimal(selectedMembership.pricePaid)
                        ).toFixed(2);
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Inputs Row */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Payment Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-white font-semibold text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={updateAmount}
                      onChange={(e) => setUpdateAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/20 focus:ring-2 focus:ring-orange-500 outline-none text-white placeholder-gray-600 hover:border-orange-500/50 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-[10px] text-white/50 mt-2">
                    Matches remaining balance
                  </p>
                </div>

                {/* Mode Select */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-3">
                    Payment Mode
                  </label>
                  <div className="relative">
                    <select
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/20 focus:ring-2 focus:ring-orange-500 outline-none text-white appearance-none cursor-pointer hover:border-orange-500/50 transition-all [&>option]:bg-slate-900"
                    >
                      <option value="">Select Mode</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-white/50 mt-2">
                    Method used for payment
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <p className="text-[10px] text-white/50 text-center uppercase tracking-wide">
                  Processing collection as: <strong className="text-orange-400">{profileName || user?.username || "Admin"}</strong>
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleUpdatePayment}
                    disabled={updating}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 py-3 rounded-xl font-semibold text-white transition-all shadow-lg"
                  >
                    {updating ? "Saving..." : "Save Payment"}
                  </button>

                  <button
                    onClick={() => setSelectedMembership(null)}
                    className="flex-1 border border-white/20 hover:border-white/40 py-3 rounded-xl font-semibold text-white transition-all hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {viewingDetails && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50"
            onClick={() => setViewingDetails(null)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-5xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden
        rounded-3xl border border-white/20
        bg-slate-950/95
        shadow-[0_30px_80px_rgba(0,0,0,0.6)] p-8"
            >
              <div className="flex items-start justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-white">
                    EMI Payment Details
                  </h2>
                </div>
                <button
                  onClick={() => setViewingDetails(null)}
                  className="rounded-full p-2 text-white/80 hover:text-white hover:bg-white/10 transition"
                  aria-label="Close details modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Top Stats */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <Card title="Plan" value={viewingDetails.planName} />
                <Card
                  title="Duration"
                  value={`${viewingDetails.duration} months`}
                />
                <Card
                  title="Initial Payment"
                  value={`₹${parseDecimal(viewingDetails.pricePaid).toFixed(2)}`}
                  color="text-green-400"
                />
                <Card
                  title="Next Payment"
                  value={`₹${(() => {
                    const plan = findPlanForMembership(viewingDetails);
                    const total = plan
                      ? parseDecimal(plan.finalPrice ?? plan.price)
                      : parseDecimal(viewingDetails.pricePaid) *
                      parseDuration(viewingDetails.duration);
                    return (
                      total - parseDecimal(viewingDetails.pricePaid)
                    ).toFixed(2);
                  })()} · due ${(() => {
                    const dueDate = calculateNextPaymentDate(viewingDetails);
                    return dueDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    });
                  })()}`}
                  color="text-blue-400"
                />
              </div>

              {/* Payment Schedule */}
              <div className="bg-slate-950/80 p-6 rounded-2xl border border-white/10 mb-6">
                <p className="text-xs uppercase tracking-wide text-white/50 font-semibold mb-4">
                  💳 30-Day Payment Schedule
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-sm text-white/60 mb-2">
                      Initial Payment
                    </p>
                    <p className="text-white font-semibold text-xl">
                      ₹{parseDecimal(viewingDetails.pricePaid).toFixed(2)}
                    </p>
                    <p className="text-xs text-white/50 mt-2">
                      Collected today
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                    <p className="text-sm text-white/60 mb-2">Next Payment</p>
                    <p className="text-white font-semibold text-xl">
                      ₹
                      {(() => {
                        const plan = findPlanForMembership(viewingDetails);
                        const total = plan
                          ? parseDecimal(plan.finalPrice ?? plan.price)
                          : parseDecimal(viewingDetails.pricePaid) *
                          parseDuration(viewingDetails.duration);
                        return (
                          total - parseDecimal(viewingDetails.pricePaid)
                        ).toFixed(2);
                      })()}
                    </p>
                    <p className="text-xs text-white/50 mt-2">
                      Due by{" "}
                      {(() => {
                        const dueDate = calculateNextPaymentDate(viewingDetails);
                        return dueDate.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Info */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Card title="Payment Mode" value={viewingDetails.paymentMode} />
                <Card title="Status" value={viewingDetails.status} />
                {viewingDetails.collectedBy && (
                  <Card title="Second Payment Collected By" value={viewingDetails.collectedBy} />
                )}
              </div>

              {/* Dues History */}
              <div className="mb-6">
                <h4 className="text-sm text-white/60 uppercase font-bold mb-2">Collected Dues</h4>
                {viewingDetails.dues && Array.isArray(viewingDetails.dues) && viewingDetails.dues.length > 0 ? (
                  <div className="space-y-2">
                    {viewingDetails.dues.map((d, i) => (
                      <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/6">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-semibold text-white">₹{parseDecimal(d.amount || d.amt || 0).toFixed(2)}</div>
                          <div className="text-xs text-white/50">Collected by: {d.collectedBy || d.collected_by || 'Unknown'}</div>
                          <div className="text-xs text-white/50">Payment type: {d.paymentId || d.payment_id || 'Cash'}</div>
                          <div className="text-xs text-white/50">Date: {d.collectedAt ? new Date(d.collectedAt).toLocaleString() : d.collected_at ? new Date(d.collected_at).toLocaleString() : '-'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-white/50">No collected dues recorded yet.</div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setViewingDetails(null)}
                  className="flex-1 w-full border border-white/20 hover:border-white/40 py-3 rounded-xl font-semibold text-white transition-all hover:bg-white/5"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDeleteMembership(viewingDetails.id)}
                  className="flex-1 w-full py-3 rounded-xl bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-all font-semibold"
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EMIList;
