import { useEffect, useState, useMemo } from "react";
import {
  Users, ShoppingCart, CreditCard, MessageSquare,
  Download, Eye, X, TrendingUp, FileText, Clock,
  ChevronDown, User
} from "lucide-react";
import api from "../../api";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import DateRangeFilter from "../DateRangeFilter";
import { filterByDateRange, getDateRangeBounds } from "../utils/dateUtils";

/* ========================
   STAT CARD
======================== */
const Stat = ({ title, value, icon: Icon, color }) => (
  <div className="rounded-2xl p-5 flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
    <div>
      <p className="text-sm text-white/60">{title}</p>
      <h2 className="text-3xl font-bold text-white mt-1">{value}</h2>
    </div>
    <div className={`p-3 rounded-xl ${color} text-2xl`}>
      <Icon size={24} />
    </div>
  </div>
);

/* ========================
   DOWNLOAD HELPERS
======================== */
const downloadPDF = (title, headers, rows) => {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${dayjs().format("DD MMM YYYY, h:mm A")}`, 14, 22);
  autoTable(doc, {
    startY: 28,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [239, 68, 68] },
  });
  doc.save(`${title}-${dayjs().format("YYYY-MM-DD")}.pdf`);
};

const downloadExcel = (title, headers, rows) => {
  const data = rows.map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i]; });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${title}-${dayjs().format("YYYY-MM-DD")}.xlsx`);
};

/* ========================
   MAIN
======================== */
const Reports = () => {
  const [members, setMembers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");
  const [dateRange, setDateRange] = useState({ type: 'All Time', range: null });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [preview, setPreview] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [trainerFilter, setTrainerFilter] = useState('all');
  const [isTrainerFilterOpen, setIsTrainerFilterOpen] = useState(false);

  /* ========================
     FETCH DATA
  ======================== */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [mRes, oRes, pRes, fRes, aRes, sRes] = await Promise.allSettled([
          api.get("/members"),
          api.get("/orders"),
          api.get("/memberships"),
          api.get("/followups"),
          api.get("/assignments"),
          api.get("/staff"),
        ]);
        if (mRes.status === "fulfilled") setMembers(Array.isArray(mRes.value.data) ? mRes.value.data : []);
        if (oRes.status === "fulfilled") setOrders(Array.isArray(oRes.value.data) ? oRes.value.data : []);
        if (pRes.status === "fulfilled") setMemberships(Array.isArray(pRes.value.data) ? pRes.value.data : []);
        if (fRes.status === "fulfilled") setEnquiries(Array.isArray(fRes.value.data) ? fRes.value.data : []);
        if (aRes.status === "fulfilled") setAssignments(Array.isArray(aRes.value.data) ? aRes.value.data : []);
        if (sRes.status === "fulfilled") {
          const staffData = Array.isArray(sRes.value.data) ? sRes.value.data : [];
          setTrainers(staffData.filter(s => String(s.role).toLowerCase() === "trainer" && String(s.status).toLowerCase() === "active"));
        }
      } catch (err) {
        console.error("Reports fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ========================
     FILTERED DATA
  ======================== */
  const filteredMembers = useMemo(() =>
    filterByDateRange(members, 'join_date', dateRange.type, dateRange.range),
    [members, dateRange]
  );

  const filteredOrders = useMemo(() =>
    filterByDateRange(orders, 'created_at', dateRange.type, dateRange.range),
    [orders, dateRange]
  );

  const filteredMemberships = useMemo(() =>
    filterByDateRange(memberships, 'startDate', dateRange.type, dateRange.range),
    [memberships, dateRange]
  );

  const calculateNextPaymentDate = (membership) => {
    const baseDate = membership.paymentDate
      ? new Date(membership.paymentDate)
      : membership.createdAt
        ? new Date(membership.createdAt)
        : new Date();
    const nextDueDate = new Date(baseDate);
    nextDueDate.setDate(nextDueDate.getDate() + 30);
    return nextDueDate;
  };

  const isEMIMembership = (membership) =>
    String(membership.paymentMode || membership.payment_mode || "").toLowerCase().startsWith("emi");

  const getMembershipStartDate = (membership) =>
    membership.pt_startDate || membership.pt_start_date || membership.startDate || membership.start_date || null;

  const getMembershipPlanName = (membership) =>
    membership.pt_planName || membership.pt_plan_name || membership.planName || membership.plan || membership.plan_name || "";

  const safeParseDues = (membership) => {
    let dues = membership?.dues ?? [];
    if (typeof dues === "string") {
      try {
        dues = JSON.parse(dues || "[]");
      } catch (err) {
        dues = [];
      }
    }
    return Array.isArray(dues) ? dues : [];
  };

  const getPaymentOrdinal = (num) => {
    const n = Number(num);
    if (Number.isNaN(n)) return `${num}th`;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
    switch (n % 10) {
      case 1: return `${n}st`;
      case 2: return `${n}nd`;
      case 3: return `${n}rd`;
      default: return `${n}th`;
    }
  };

  const buildMembershipPaymentLines = (membership) => {
    const initialAmount = Number(membership.pricePaid || 0);
    const secondAmount = Number(membership.secondPaymentPaid || 0);
    const dues = safeParseDues(membership);
    const amountLines = [];
    const modeLines = [];

    const initialMode = membership.paymentMode || membership.paymentId || "Cash";
    if (initialAmount > 0) {
      amountLines.push(`${getPaymentOrdinal(amountLines.length + 1)} payment ₹${initialAmount.toFixed(2)}`);
      modeLines.push(initialMode);
    }

    if (dues.length > 0) {
      dues.forEach((due) => {
        const amount = Number(due?.amount ?? due?.amt ?? 0);
        if (!Number.isFinite(amount) || amount <= 0) return;
        amountLines.push(`${getPaymentOrdinal(amountLines.length + 1)} payment ₹${amount.toFixed(2)}`);
        modeLines.push(due?.paymentId || due?.payment_id || "Cash");
      });
    } else if (secondAmount > 0) {
      amountLines.push(`${getPaymentOrdinal(amountLines.length + 1)} payment ₹${secondAmount.toFixed(2)}`);
      modeLines.push(membership.paymentId || membership.paymentMode || "Cash");
    }

    if (amountLines.length === 0) {
      return { amountText: "-", modeText: membership.paymentMode || membership.paymentId || "-" };
    }

    return {
      amountText: amountLines.join("\n"),
      modeText: modeLines.join("\n"),
    };
  };

  const findAssignment = (record) => {
    if (!assignments || assignments.length === 0) return null;

    const normalized = {
      userId: record.userId || record.user_id,
      userUuid: record.user_id_uuid || record.userUuid,
      userEmail: (record.userEmail || record.userEmail === "" ? record.userEmail : record.email || record.user_email) || "",
      userMobile: record.userMobile || record.user_mobile || record.phone || record.userPhone || "",
      username: record.username || record.userName || record.userName || record.name || "",
      planId: record.planId || record.plan_id || record.pt_planId || record.pt_plan_id || null,
      planName: record.planName || record.plan_name || record.pt_planName || record.pt_plan_name || "",
    };

    return assignments.find((a) => {
      const assignmentEmail = String(a.userEmail || "").toLowerCase();
      const assignmentUsername = String(a.username || "").toLowerCase();
      const recordEmail = String(normalized.userEmail || "").toLowerCase();
      const recordUsername = String(normalized.username || "").toLowerCase();
      const recordMobile = String(normalized.userMobile || "");

      return (
        (normalized.userId && a.userId && String(normalized.userId) === String(a.userId)) ||
        (normalized.userUuid && a.userUuid && String(normalized.userUuid) === String(a.userUuid)) ||
        (recordEmail && assignmentEmail && recordEmail === assignmentEmail) ||
        (recordMobile && a.userMobile && recordMobile === String(a.userMobile)) ||
        (recordUsername && assignmentUsername && recordUsername === assignmentUsername)
      );
    });
  };

  const getMembershipTrainerName = (membership) => {
    const assignment = findAssignment(membership);
    return assignment?.trainerName || assignment?.trainer_name || assignment?.trainer || "-";
  };

  const getEnquiryTrainerName = (enquiry) => {
    if (enquiry.trainer_name || enquiry.trainerName) {
      return enquiry.trainer_name || enquiry.trainerName;
    }
    const assignment = findAssignment(enquiry);
    return assignment?.trainerName || assignment?.trainer_name || assignment?.trainer || "-";
  };

  const isPTPlanMembership = (membership) => {
    const planName = String(getMembershipPlanName(membership)).toLowerCase();
    const hasPT = membership.has_pt_plan || membership.hasPTPlan || membership.isPTPlanPurchase || Boolean(membership.pt_planName);
    return hasPT || planName.includes("pt") || planName.includes("personal training");
  };

  const filteredEMIs = useMemo(() => {
    const emiMemberships = memberships.filter(isEMIMembership);
    if (dateRange.type === 'All Time') return emiMemberships;

    const { start, end } = getDateRangeBounds(dateRange.type, dateRange.range);
    if (!start || !end) return emiMemberships;

    return emiMemberships.filter((membership) => {
      // Calculate remaining to know if it's already paid
      const totalAmount = membership.price != null ? parseFloat(membership.price) : null;
      const paidAmount = membership.pricePaid != null ? parseFloat(membership.pricePaid) + (membership.secondPaymentPaid ? parseFloat(membership.secondPaymentPaid) : 0) : null;
      const remaining = totalAmount != null && paidAmount != null ? Math.max(0, totalAmount - paidAmount) : null;

      // If fully paid, it shouldn't show up in a specific date filter for "Next EMI Date"
      // or maybe it should? The user wants "Next EMI Date based filter add give proeprly"
      // Let's filter by the Next EMI Date. If there's no Next EMI Date (because it's paid), skip.
      if (typeof remaining === "number" && remaining <= 0) {
         return false; // Paid, no next EMI date
      }

      const nextDate = calculateNextPaymentDate(membership);
      const date = dayjs(nextDate);
      return date.isValid() && !date.isBefore(start, 'day') && !date.isAfter(end, 'day');
    });
  }, [memberships, dateRange]);

  const filteredPTPlans = useMemo(() => {
    const ptPlans = memberships.filter(isPTPlanMembership);
    if (dateRange.type === 'All Time') return ptPlans;

    const { start, end } = getDateRangeBounds(dateRange.type, dateRange.range);
    if (!start || !end) return ptPlans;

    return ptPlans.filter((membership) => {
      const date = dayjs(getMembershipStartDate(membership));
      return date.isValid() && !date.isBefore(start) && !date.isAfter(end);
    });
  }, [memberships, dateRange]);

  const filteredEnquiries = useMemo(() =>
    filterByDateRange(enquiries, 'created_at', dateRange.type, dateRange.range),
    [enquiries, dateRange]
  );

  const filteredExpiringMembers = useMemo(() => {
    let base = members.filter(m => !!m.expiry_date);
    if (dateRange.type !== 'All Time') {
      const { start, end } = getDateRangeBounds(dateRange.type, dateRange.range);
      if (start && end) {
        base = base.filter(m => {
          const date = dayjs(m.expiry_date);
          return date.isValid() && !date.isBefore(start) && !date.isAfter(end);
        });
      }
    } else {
        const today = dayjs();
        const next5Days = today.add(5, "day");
        base = base.filter(m => {
          const expiryDate = dayjs(m.expiry_date);
          return expiryDate.isAfter(today.subtract(1, 'day')) && expiryDate.isBefore(next5Days.add(1, 'day'));
        });
    }
    return base.sort((a, b) => dayjs(a.expiry_date).diff(dayjs(b.expiry_date)));
  }, [members, dateRange]);

  /* ========================
     TABLE CONFIGS
  ======================== */
  const tabs = [
    {
      key: "members",
      label: "Members",
      icon: Users,
      color: "bg-blue-500/20 text-blue-400",
      data: filteredMembers,
      headers: ["S No", "Name", "Email", "Mobile Number", "Plan", "Status", "Join Date"],
      rows: filteredMembers.map((m, i) => {
        let actualStatus = (m.status || "active").toLowerCase();
        // Only override to Expired if the expiry_date has actually passed
        if (m.expiry_date && dayjs(m.expiry_date).startOf('day').isBefore(dayjs().startOf('day'))) {
          actualStatus = "expired";
        }
        actualStatus = actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1);

        return [
          i + 1,
          m.name || "N/A",
          m.email || m.user_email || "-",
          m.phone || "-",
          m.plan && m.plan.toLowerCase() !== 'user' ? m.plan : (m.plan || "-"),
          actualStatus,
          m.join_date ? dayjs(m.join_date).format("DD MMM YYYY") : "-",
        ];
      }),
    },
    {
      key: "orders",
      label: "Orders",
      icon: ShoppingCart,
      color: "bg-orange-500/20 text-orange-400",
      data: filteredOrders,
      headers: ["#", "Order ID", "Customer", "Total", "Status", "Date"],
      rows: filteredOrders.map((o, i) => [
        i + 1,
        o.id || o.order_id || "-",
        o.name || o.user_name || o.customer_name || "-",
        `₹${parseFloat(o.total || o.total_amount || 0).toFixed(2)}`,
        o.status || "-",
        o.created_at ? dayjs(o.created_at).format("DD MMM YYYY") : "-",
      ]),
    },
    {
      key: "payments",
      label: "Plans / Payments",
      icon: CreditCard,
      color: "bg-green-500/20 text-green-400",
      data: filteredMemberships,
      headers: ["S No", "Member", "Email", "Plan", "Assigned Trainer", "Amount", "Mode", "Workout", "Diet", "PT Form", "Status", "Start", "End"],
      rows: filteredMemberships.map((p, i) => {
        const hasWorkout = !!(p.workout_count || p.workoutCount || p.hasWorkout || p.workoutAssigned || p.workout);
        const hasDiet = !!(p.diet_count || p.dietCount || p.hasDiet || p.dietAssigned || p.diet);
        const ptFormCompleted = !!(p.pt_form_completed);
        const paymentLines = buildMembershipPaymentLines(p);
        return [
          i + 1,
          p.userName || p.username || "-",
          p.userEmail || p.email || "-",
          p.planName || "-",
          getMembershipTrainerName(p),
          paymentLines.amountText,
          paymentLines.modeText,
          hasWorkout ? "Yes" : "No",
          hasDiet ? "Yes" : "No",
          ptFormCompleted ? "Yes" : "Pending",
          p.status || "active",
          p.startDate ? dayjs(p.startDate).format("DD MMM YYYY") : "-",
          p.endDate ? dayjs(p.endDate).format("DD MMM YYYY") : "-",
        ];
      }),
    },
    {
      key: "emi",
      label: "EMI Records",
      icon: CreditCard,
      color: "bg-red-500/20 text-red-400",
      data: filteredEMIs,
      headers: ["S No", "Member", "Email", "Plan", "Assigned Trainer", "Total", "Paid", "Remaining", "Next EMI Date", "Mode", "Status", "Start", "End"],
      rows: filteredEMIs.map((p, i) => {
        const totalAmount = p.price != null ? parseFloat(p.price) : null;
        const paidAmount = p.pricePaid != null ? parseFloat(p.pricePaid) + (p.secondPaymentPaid ? parseFloat(p.secondPaymentPaid) : 0) : null;
        const remaining = totalAmount != null && paidAmount != null ? Math.max(0, totalAmount - paidAmount) : "-";
        
        let nextEmiDateStr = "-";
        if (typeof remaining === "number" && remaining > 0) {
          nextEmiDateStr = dayjs(calculateNextPaymentDate(p)).format("DD MMM YYYY");
        } else if (typeof remaining === "number" && remaining <= 0) {
          nextEmiDateStr = "Paid";
        }

        return [
          i + 1,
          p.userName || p.username || "-",
          p.userEmail || p.email || "-",
          p.planName || "-",
          getMembershipTrainerName(p),
          totalAmount != null ? `₹${totalAmount.toFixed(2)}` : "-",
          paidAmount != null ? `₹${paidAmount.toFixed(2)}` : "-",
          typeof remaining === "number" ? `₹${remaining.toFixed(2)}` : "-",
          nextEmiDateStr,
          (p.paymentMode || "").toLowerCase().startsWith("emi-") ? p.paymentMode.split('-')[1] : p.paymentMode || p.paymentId ? (p.paymentMode || "Razorpay") : "-",
          p.status || "active",
          p.startDate ? dayjs(p.startDate).format("DD MMM YYYY") : "-",
          p.endDate ? dayjs(p.endDate).format("DD MMM YYYY") : "-",
        ];
      }),
    },
    {
      key: "pt-plans",
      label: "PT Plan Buys",
      icon: Users,
      color: "bg-indigo-500/20 text-indigo-400",
      data: filteredPTPlans,
      headers: ["S No", "Member", "Email", "Plan", "Assigned Trainer", "Amount", "Status", "Start", "End"],
      rows: filteredPTPlans.map((p, i) => {
        const startDate = p.pt_startDate || p.startDate || p.start_date;
        const endDate = p.pt_endDate || p.endDate || p.end_date;
        const paymentAmount = p.pt_pricePaid != null 
          ? (parseFloat(p.pt_pricePaid) + (p.pt_secondPaymentPaid ? parseFloat(p.pt_secondPaymentPaid) : 0)) 
          : p.pricePaid != null 
            ? (parseFloat(p.pricePaid) + (p.secondPaymentPaid ? parseFloat(p.secondPaymentPaid) : 0)) 
            : null;
        const paymentMode = (p.pt_paymentMode || p.paymentMode || p.payment_mode || "-").toLowerCase().startsWith("emi-") 
          ? (p.pt_paymentMode || p.paymentMode || p.payment_mode || "").split('-')[1] 
          : p.pt_paymentMode || p.paymentMode || p.payment_mode || "-";

        return [
          i + 1,
          p.userName || p.username || "-",
          p.userEmail || p.email || "-",
          p.pt_planName || p.planName || p.plan || "-",
          getMembershipTrainerName(p),
          paymentAmount != null ? `₹${parseFloat(paymentAmount).toFixed(2)}` : "-",
          p.pt_status || p.status || "active",
          startDate ? dayjs(startDate).format("DD MMM YYYY") : "-",
          endDate ? dayjs(endDate).format("DD MMM YYYY") : "-",
        ];
      }),
    },
    {
      key: "enquiries",
      label: "Followup Enquiries",
      icon: MessageSquare,
      color: "bg-purple-500/20 text-purple-400",
      data: filteredEnquiries,
      headers: ["S No", "Name", "Email", "Mobile Number", "Assigned Trainer", "Subject", "Message", "Next Follow Up", "Status", "Date"],
      rows: filteredEnquiries.map((e, i) => [
        i + 1,
        e.name || "-",
        e.email || "-",
        e.phone || "-",
        getEnquiryTrainerName(e),
        e.subject || "-",
        e.message || "-",
        e.next_followup_date ? dayjs(e.next_followup_date).format("DD MMM YYYY") : "-",
        e.status || "pending",
        e.created_at ? dayjs(e.created_at).format("DD MMM YYYY") : "-",
      ]),
    },
    {
      key: "expiring_members",
      label: "Plan Expiry",
      icon: Clock,
      color: "bg-yellow-500/20 text-yellow-400",
      data: filteredExpiringMembers,
      headers: ["S No", "Name", "Email", "Mobile Number", "Assigned Trainer", "Plan", "Expiry Date", "Days Left", "Status"],
      rows: filteredExpiringMembers.map((m, i) => {
        const daysLeft = dayjs(m.expiry_date).startOf('day').diff(dayjs().startOf('day'), 'day');
        return [
          i + 1,
          m.name || "N/A",
          m.email || m.user_email || "-",
          m.phone || "-",
          getMembershipTrainerName(m),
          m.plan || "N/A",
          m.expiry_date ? dayjs(m.expiry_date).format("DD MMM YYYY") : "-",
          daysLeft >= 0 ? (daysLeft === 0 ? 'Today' : `${daysLeft} Days`) : 'Expired',
          daysLeft >= 0 ? 'Active' : 'Expired'
        ];
      }),
    },
  ];

  const currentTab = tabs.find(t => t.key === activeTab);
  const currentTabRows = currentTab ? currentTab.rows : [];

  const getCellBadgeClasses = (cell) => {
    const value = String(cell).trim().toLowerCase();
    if (value === "yes" || value === "active") return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    if (value === "no" || value === "inactive" || value === "expired") return "bg-red-500/20 text-red-300 border border-red-500/30";
    return "text-white/80";
  };

  // Find the "Assigned Trainer" column index for the active tab
  const trainerColIndex = useMemo(() => {
    if (!currentTab) return -1;
    return currentTab.headers.indexOf("Assigned Trainer");
  }, [currentTab]);

  const filteredTabRows = useMemo(() => {
    let rows = currentTabRows;

    // Apply trainer filter
    if (trainerFilter !== 'all' && trainerColIndex >= 0) {
      rows = rows.filter((row) => {
        const cellValue = String(row[trainerColIndex] || "").toLowerCase();
        return cellValue === trainerFilter.toLowerCase();
      });
    }

    // Apply search filter
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      rows = rows.filter((row) =>
        row.some((cell) => String(cell).toLowerCase().includes(term))
      );
    }
    return rows;
  }, [currentTabRows, searchTerm, trainerFilter, trainerColIndex]);
  const totalPages = Math.max(1, Math.ceil(filteredTabRows.length / rowsPerPage));
  const paginatedRows = filteredTabRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  // Build unique trainer names from trainers list only
  const uniqueTrainerNames = useMemo(() => {
    const names = new Set();
    trainers.forEach(t => {
      const name = t.name || t.username;
      if (name) names.add(name);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [trainers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, dateRange, searchTerm, trainerFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* ========================
     UI
  ======================== */
  return (
    <div className="p-0 min-h-screen space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
            <p className="text-white/50 text-sm">Download and view gym data reports</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
            <div className="hidden md:flex items-center gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search reports..."
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          <DateRangeFilter onRangeChange={(type, range) => setDateRange({ type, range })} />

          {/* Trainer Filter Dropdown */}
          <div className="relative inline-block text-left">
            <button
              onClick={() => setIsTrainerFilterOpen(!isTrainerFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition whitespace-nowrap ${
                trainerFilter !== 'all'
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                  : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }`}
            >
              <Users size={15} />
              <span className="truncate max-w-[120px]">
                {trainerFilter === 'all' ? 'All Trainers' : trainerFilter}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isTrainerFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTrainerFilterOpen && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setIsTrainerFilterOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 max-h-72 overflow-y-auto rounded-2xl bg-[#0f172a] border border-white/10 shadow-2xl z-[100] p-2 custom-scrollbar">
                  <button
                    onClick={() => { setTrainerFilter('all'); setCurrentPage(1); setIsTrainerFilterOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      trainerFilter === 'all'
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Users size={14} />
                    All Trainers
                  </button>
                  {uniqueTrainerNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => { setTrainerFilter(name); setCurrentPage(1); setIsTrainerFilterOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        trainerFilter === name
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <User size={14} />
                      <span className="truncate">{name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => downloadPDF(currentTab.label, currentTab.headers, filteredTabRows)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition whitespace-nowrap"
          >
            <Download size={15} /> PDF
          </button>
          <button
            onClick={() => downloadExcel(currentTab.label, currentTab.headers, filteredTabRows)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition whitespace-nowrap"
          >
            <Download size={15} /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat title="Total Members" value={filteredMembers.length} icon={Users} color="bg-blue-500/20 text-blue-400" />
        <Stat title="Total Orders" value={filteredOrders.length} icon={ShoppingCart} color="bg-orange-500/20 text-orange-400" />
        <Stat title="Plan Purchases" value={filteredMemberships.length} icon={CreditCard} color="bg-green-500/20 text-green-400" />
        <Stat title="EMI Records" value={filteredEMIs.length} icon={CreditCard} color="bg-red-500/20 text-red-400" />
        <Stat title="PT Plan Buys" value={filteredPTPlans.length} icon={Users} color="bg-indigo-500/20 text-indigo-400" />
        <Stat title="Enquiries" value={filteredEnquiries.length} icon={MessageSquare} color="bg-purple-500/20 text-purple-400" />
        <Stat title="Plan Expiry" value={filteredExpiringMembers.length} icon={Clock} color="bg-yellow-500/20 text-yellow-400" />
      </div>

      {/* TABS */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${activeTab === t.key
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
            >
              <Icon size={16} /> {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === t.key ? "bg-white/20" : "bg-white/10"}`}>
                {t.data.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* TABLE */}
      <div className="rounded-2xl overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white/50 animate-pulse text-sm">Loading report data...</p>
          </div>
        ) : currentTab.rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <TrendingUp size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-medium">No {currentTab.label} data found</p>
            <p className="text-sm mt-1">Data will appear here once added</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-white">
                <thead className="bg-white/10 border-b border-white/10">
                  <tr>
                    {currentTab.headers.map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-white/80 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-white/5 transition ${i % 2 === 0 ? 'bg-white/5' : 'bg-transparent'} hover:bg-white/10`}
                    >
                      {row.map((cell, j) => {
                        const value = String(cell).trim().toLowerCase();
                        const badgeClasses = getCellBadgeClasses(cell);
                        return (
                          <td key={j} className="px-4 py-3 whitespace-pre-line break-words align-top">
                            {value === "yes" || value === "no" || value === "active" || value === "inactive" || value === "expired" ? (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${badgeClasses}`}>
                                {cell}
                              </span>
                            ) : (
                              <span className={badgeClasses}>{cell}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 border-t border-white/10 bg-slate-950/40">
              <div className="flex items-center gap-3 text-white/70 text-sm">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none"
                >
                  {[10, 20, 30, 50,100,200,300,400,500].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span>
                  Showing {Math.min((currentPage - 1) * rowsPerPage + 1, filteredTabRows.length)} - {Math.min(currentPage * rowsPerPage, filteredTabRows.length)} of {filteredTabRows.length}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-sm text-white/70">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* FOOTER COUNT */}
      {!loading && currentTab.rows.length > 0 && (
        <p className="text-white/40 text-xs text-right">
          Showing {currentTab.rows.length} {currentTab.label.toLowerCase()} records
        </p>
      )}
    </div>
  );
};

export default Reports;
