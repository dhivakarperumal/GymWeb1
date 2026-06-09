import { useEffect, useState, useMemo } from "react";
import {
  Users, ShoppingCart, CreditCard, MessageSquare,
  Download, Eye, X, TrendingUp, FileText, Clock
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

  /* ========================
     FETCH DATA
  ======================== */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [mRes, oRes, pRes, fRes, aRes] = await Promise.allSettled([
          api.get("/members"),
          api.get("/orders"),
          api.get("/memberships"),
          api.get("/followups"),
          api.get("/assignments"),
        ]);
        if (mRes.status === "fulfilled") setMembers(Array.isArray(mRes.value.data) ? mRes.value.data : []);
        if (oRes.status === "fulfilled") setOrders(Array.isArray(oRes.value.data) ? oRes.value.data : []);
        if (pRes.status === "fulfilled") setMemberships(Array.isArray(pRes.value.data) ? pRes.value.data : []);
        if (fRes.status === "fulfilled") setEnquiries(Array.isArray(fRes.value.data) ? fRes.value.data : []);
        if (aRes.status === "fulfilled") setAssignments(Array.isArray(aRes.value.data) ? aRes.value.data : []);
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
    String(membership.paymentMode || membership.payment_mode || "").toLowerCase() === "emi";

  const getMembershipStartDate = (membership) =>
    membership.pt_startDate || membership.pt_start_date || membership.startDate || membership.start_date || null;

  const getMembershipPlanName = (membership) =>
    membership.pt_planName || membership.pt_plan_name || membership.planName || membership.plan || membership.plan_name || "";

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

  const filteredEMIs = useMemo(() =>
    filterByDateRange(memberships.filter(isEMIMembership), 'startDate', dateRange.type, dateRange.range),
    [memberships, dateRange]
  );

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
      rows: filteredMembers.map((m, i) => [
        i + 1,
        m.name || "N/A",
        m.email || m.user_email || "-",
        m.phone || "-",
        m.plan || m.role || "Member",
        m.status || "Active",
        m.join_date ? dayjs(m.join_date).format("DD MMM YYYY") : "-",
      ]),
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
        return [
          i + 1,
          p.userName || p.username || "-",
          p.userEmail || p.email || "-",
          p.planName || "-",
          getMembershipTrainerName(p),
          p.pricePaid != null ? `₹${parseFloat(p.pricePaid).toFixed(2)}` : "-",
          p.paymentMode || p.paymentId ? (p.paymentMode || "Razorpay") : "-",
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
          p.paymentMode || p.paymentId ? (p.paymentMode || "Razorpay") : "-",
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
        const paymentAmount = p.pt_pricePaid != null ? p.pt_pricePaid : p.pricePaid != null ? p.pricePaid : null;
        const paymentMode = p.pt_paymentMode || p.paymentMode || p.payment_mode || "-";

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
          daysLeft > 0 ? `${daysLeft} Days` : 'Expired',
          daysLeft > 0 ? 'Active' : 'Inactive'
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

  const filteredTabRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return currentTabRows;
    return currentTabRows.filter((row) =>
      row.some((cell) => String(cell).toLowerCase().includes(term))
    );
  }, [currentTabRows, searchTerm]);
  const totalPages = Math.max(1, Math.ceil(filteredTabRows.length / rowsPerPage));
  const paginatedRows = filteredTabRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, dateRange, searchTerm]);

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
        <div className="flex items-center gap-3">
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
                          <td key={j} className="px-4 py-3 whitespace-nowrap">
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
