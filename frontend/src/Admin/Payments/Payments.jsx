import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  LayoutGrid,
  List,
} from "lucide-react";
import * as XLSX from "xlsx";
import { FaPrint } from "react-icons/fa";
import toast from "react-hot-toast";

// backend API
import api from "../../api";
import cache from "../../cache";
import { useAuth } from "../../PrivateRouter/AuthContext";
const MEMBERSHIPS_API = `memberships`;
const MEMBERS_API = `members`;

const Payments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profileName } = useAuth();
  
  const isTrainerPanel = location.pathname.startsWith("/trainer");
  const cacheKey = isTrainerPanel ? `trainerPayments_${user?.id}` : "adminPayments";

  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [viewType, setViewType] = useState("table");
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchPayments = async () => {
      if (cache[cacheKey]) {
        setMembers(cache[cacheKey]);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const res = await api.get(MEMBERSHIPS_API);
        const membershipsData = res.data;

        // Group memberships by user to match the existing UI shape
        const usersMap = new Map();

        if (!Array.isArray(membershipsData)) {
          console.warn("Expected array for memberships, got:", membershipsData);
          setMembers([]);
          return;
        }

        const loggedInTrainerName = (profileName || user?.username || user?.name || "").toLowerCase().trim();

        membershipsData.forEach((m) => {
          // If on trainer panel, filter for trainer collected only
          if (isTrainerPanel) {
            const referredByLower = (m.referredBy || "").toLowerCase().trim();
            if (
              !referredByLower || 
              (referredByLower !== loggedInTrainerName && 
               !referredByLower.includes(loggedInTrainerName) && 
               !loggedInTrainerName.includes(referredByLower))
            ) {
              return;
            }
          }

          const uId = m.userId || `guest_${m.id}`;
          if (!usersMap.has(uId)) {
            usersMap.set(uId, {
              uid: uId,
              username: m.username || m.userName || "No Name",
              email: m.email || m.userEmail || "",
              plans: [],
            });
          }

          // Only show plans that are active
          if (m.status !== "active") return;

          usersMap.get(uId).plans.push({
            id: m.id,
            planName: m.planName,
            price: m.price || 0,
            pricePaid: m.pricePaid || 0,
            secondPaymentPaid: m.secondPaymentPaid || 0,
            duration: m.duration || "",
            paymentMode: m.paymentMode || "",
            startDate: m.startDate,
            endDate: m.endDate,
            paymentDate: m.paymentDate || null,
            createdAt: m.createdAt,
            status: m.status || "active",
            paymentStatus: m.paymentStatus || (m.pricePaid >= m.price ? "Paid" : "Pending"),
            referredBy: m.referredBy || "",
            phone: m.mobile || m.userPhone || "",
            discount: m.discount || 0,
            amount: m.amount || 0,
            pt_planName: m.pt_planName || "",
            pt_startDate: m.pt_startDate || null,
            pt_endDate: m.pt_endDate || null,
          });
        });

        const finalData = Array.from(usersMap.values());
        setMembers(finalData);
        cache[cacheKey] = finalData;
      } catch (error) {
        console.error(error);
        if (!cache[cacheKey]) toast.error("Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [isTrainerPanel, user, profileName]);

  /* ================= EXPIRY CHECK ================= */
  const isExpiringPlan = (endDate) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const today = new Date();
    const days = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return days <= 7 && days > 0;
  };

  const isToday = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  };

  const isYesterday = (date) => {
    if (!date) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const d = new Date(date);
    return d.toDateString() === yesterday.toDateString();
  };

  const isThisWeek = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return d >= startOfWeek;
  };

  const isThisMonth = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  };

  const isInCustomRange = (date) => {
    if (!date || !customStart || !customEnd) return true;
    const d = new Date(date);
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  };

  const getSerialNumber = (index) =>
    (currentPage - 1) * itemsPerPage + index + 1;

  /* ================= MARK STATUS ================= */
  const handleStatusChange = async (memberId, planId, newStatus) => {
    if (!window.confirm(`Mark this plan as ${newStatus}?`)) return;

    try {
      // update via API
      const res = await api.put(`${MEMBERSHIPS_API}/${planId}`, {
        status: newStatus,
      });

      if (res.status !== 200) {
        console.error("status update failed");
        toast.error("Update failed");
        return;
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.uid !== memberId
            ? m
            : {
                ...m,
                plans: m.plans.map((p) =>
                  p.id === planId
                    ? {
                        ...p,
                        status: newStatus,
                      }
                    : p,
                ),
              },
        ),
      );
    } catch (err) {
      console.error(err);
      toast.error("Update failed");
    }
  };

  const getRemainingDays = (endDate) => {
    if (!endDate) return "-";

    const end = new Date(endDate);
    const today = new Date();

    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) return "Expired";
    if (diff === 0) return "Last Day";

    return `${diff} days`;
  };

  /* ================= PRINT RECEIPT ================= */
  const handlePrintReceipt = (member, plan) => {
    const receiptNo = `REC-${plan.id || Math.floor(Math.random() * 900000 + 100000)}`;
    const printedOn = new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });

    const totalAmount   = Number(plan.price || 0);
    const pricePaid     = Number(plan.pricePaid || 0);
    const secondPayment = Number(plan.secondPaymentPaid || 0);
    const totalPaid     = pricePaid + secondPayment;
    const balance       = Math.max(0, totalAmount - totalPaid);
    const discount      = Number(plan.discount || 0);
    const originalPrice = Number(plan.amount || plan.price || 0);

    const paymentModeLabel = (plan.paymentMode || "cash").toUpperCase();
    const paymentStatusColor =
      plan.paymentStatus === "Paid"    ? "#16a34a" :
      plan.paymentStatus === "Pending" ? "#dc2626" :
      plan.paymentStatus === "Partial" ? "#d97706" : "#6b7280";

    const row = (label, value, valueColor = "#111") => `
      <tr>
        <td style="padding:7px 10px; color:#555; font-size:13px; border-bottom:1px solid #f0f0f0;">${label}</td>
        <td style="padding:7px 10px; font-size:13px; font-weight:600; color:${valueColor}; text-align:right; border-bottom:1px solid #f0f0f0;">${value}</td>
      </tr>`;

    const receiptContent = `
      <style>
        @media print {
          @page { margin: 0; }
          body { margin: 0; padding: 0; }
          .no-print { display: none; }
          .card { box-shadow: none !important; border: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
        }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 10px; }
        .card { max-width: 400px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.12); }
        .header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 12px 16px 8px; text-align: center; }
        .header h1 { margin: 0 0 2px; color: #fff; font-size: 18px; letter-spacing: 1px; }
        .header p  { margin: 0; color: rgba(255,255,255,0.85); font-size: 11px; }
        .badge { display: inline-block; margin-top: 6px; background: rgba(255,255,255,0.2); color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 3px 10px; border-radius: 20px; }
        .section { padding: 6px 16px 0; }
        .section-title { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #f97316; margin-bottom: 2px; border-left: 3px solid #f97316; padding-left: 6px; }
        table { width: 100%; border-collapse: collapse; }
        .divider { border: none; border-top: 1px dashed #e5e5e5; margin: 4px 16px; }
        .total-row td { padding: 4px 10px; font-size: 13px; font-weight: 700; }
        .footer { background: #fafafa; border-top: 1px solid #eee; padding: 10px 16px; text-align: center; }
        .footer p { margin: 2px 0; font-size: 10px; color: #888; }
        .footer .tagline { font-size: 12px; font-weight: 600; color: #f97316; margin-bottom: 2px; }
        .status-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.5px; }
        .print-btn { display: block; margin: 10px auto 0; padding: 6px 20px; background: #f97316; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
      </style>

      <div class="card">
        <!-- HEADER -->
        <div class="header">
          <h1>💪 DAP Fitness Studio</h1>
          <p>Official Membership Payment Receipt</p>
          <div class="badge">RECEIPT NO: ${receiptNo}</div>
        </div>

        <!-- MEMBER INFO -->
        <div class="section">
          <p class="section-title">Member Details</p>
          <table>
            ${row("Member Name", member.username || "--")}
            ${row("Email Address", member.email || "--")}
            ${row("Mobile Number", plan.phone || "--")}
          </table>
        </div>

        <hr class="divider" />

        <!-- PLAN INFO -->
        <div class="section">
          <p class="section-title">Plan Details</p>
          <table>
            ${row("Plan Name", plan.planName || "--")}
            ${row("Duration", plan.duration ? `${plan.duration}` : "--")}
            ${row("Start Date", formatDate(plan.startDate))}
            ${row("End Date", formatDate(plan.endDate))}
            ${row("Days Remaining", getRemainingDays(plan.endDate), getRemainingDays(plan.endDate) === "Expired" ? "#dc2626" : "#16a34a")}
          </table>
        </div>

        <hr class="divider" />

        <!-- PAYMENT INFO -->
        <div class="section">
          <p class="section-title">Payment Details</p>
          <table>
            ${originalPrice > 0 ? row("Original Price", `&#8377;${originalPrice.toFixed(2)}`) : ""}
            ${discount > 0 ? row("Discount Amount", `&#8377;${discount.toFixed(2)}`, "#dc2626") : ""}
            ${row("Total Price (After Discount)", `&#8377;${totalAmount.toFixed(2)}`)}
            ${row("Initial Amount Paid", `&#8377;${pricePaid.toFixed(2)}`, "#16a34a")}
            ${secondPayment > 0 ? row("Second Payment", `&#8377;${secondPayment.toFixed(2)}`, "#16a34a") : ""}
            ${balance > 0 ? row("Balance Due", `&#8377;${balance.toFixed(2)}`, "#dc2626") : ""}
            ${row("Payment Mode", paymentModeLabel)}
            ${row("Payment Date", plan.paymentDate ? formatDate(plan.paymentDate) : formatDate(plan.createdAt))}
            <tr>
              <td style="padding:7px 10px; color:#555; font-size:13px; border-bottom:1px solid #f0f0f0;">Payment Status</td>
              <td style="padding:7px 10px; text-align:right; border-bottom:1px solid #f0f0f0;">
                <span class="status-badge" style="background:${paymentStatusColor}22; color:${paymentStatusColor}; border:1px solid ${paymentStatusColor}44;">
                  ${plan.paymentStatus || "Paid"}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <hr class="divider" />

        <!-- TOTAL PAID ROW -->
        <div class="section" style="padding-bottom:4px;">
          <table>
            <tr class="total-row">
              <td style="color:#111;">Total Amount Paid</td>
              <td style="text-align:right; color:#f97316;">&#8377;${totalPaid.toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <hr class="divider" />

        <!-- COLLECTED BY + DATES -->
        <div class="section" style="padding-bottom:14px;">
          <table>
            ${row("Collected By", plan.referredBy || "Admin", "#f97316")}
            ${row("Receipt Printed On", printedOn)}
          </table>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <p class="tagline">Thank you for being a valued member! 🙏</p>
          <p>Keep up the great work on your fitness journey.</p>
          <p style="margin-top:8px; font-size:10px; color:#bbb;">This is a computer-generated receipt and does not require a signature.</p>
        </div>
      </div>

      <button class="print-btn no-print" onclick="window.print()">🖨️ Print Receipt</button>
    `;

    const printWindow = window.open("", "_blank", "width=640,height=820");
    if (printWindow) {
      printWindow.document.write(
        "<html><head><title>Receipt – " + receiptNo + "</title></head><body>",
      );
      printWindow.document.write(receiptContent);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
    }
  };


  /* ================= FILTER ================= */
  // Get flat list of all plans for counting
  const allInitialPlans = [];
  members.forEach((member) => {
    member.plans.forEach((plan) => {
      // Date Filter for counts
      let passDate = true;
      if (dateFilter === "today" && !isToday(plan.createdAt)) passDate = false;
      if (dateFilter === "yesterday" && !isYesterday(plan.createdAt))
        passDate = false;
      if (dateFilter === "this week" && !isThisWeek(plan.createdAt))
        passDate = false;
      if (dateFilter === "this month" && !isThisMonth(plan.createdAt))
        passDate = false;
      if (dateFilter === "custom" && !isInCustomRange(plan.createdAt))
        passDate = false;

      if (passDate) {
        allInitialPlans.push(plan);
      }
    });
  });

  const counts = {
    all: allInitialPlans.length,
    active: allInitialPlans.filter((p) => p.status === "active").length,
    inactive: allInitialPlans.filter((p) => p.status === "inactive").length,
    expiry: allInitialPlans.filter((p) => isExpiringPlan(p.endDate)).length,
  };

  const filteredMembers = members
    .map((member) => ({
      ...member,
      plans: member.plans.filter((plan) => {
        const q = search.toLowerCase();

        const match =
          member.username?.toLowerCase().includes(q) ||
          member.email?.toLowerCase().includes(q) ||
          plan.planName?.toLowerCase().includes(q);

        if (!match) return false;

        // Status Filter
        if (filterType === "active" && plan.status !== "active") return false;
        if (filterType === "inactive" && plan.status !== "inactive")
          return false;
        if (filterType === "expiry" && !isExpiringPlan(plan.endDate))
          return false;

        // Date Filter
        if (dateFilter === "today" && !isToday(plan.createdAt)) return false;
        if (dateFilter === "yesterday" && !isYesterday(plan.createdAt))
          return false;
        if (dateFilter === "this week" && !isThisWeek(plan.createdAt))
          return false;
        if (dateFilter === "this month" && !isThisMonth(plan.createdAt))
          return false;
        if (dateFilter === "custom" && !isInCustomRange(plan.createdAt))
          return false;

        return true;
      }),
    }))
    .filter((m) => m.plans.length > 0);

  /* ================= FLATTEN FOR PAGINATION ================= */
  const allPlans = [];
  filteredMembers.forEach((member) => {
    member.plans.forEach((plan) => {
      allPlans.push({ member, plan });
    });
  });

  const totalPages = Math.ceil(allPlans.length / itemsPerPage);

  const paginatedPlans = allPlans.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  /* RESET PAGE ON SEARCH/FILTER */
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAll(false);
  }, [search, filterType, dateFilter, customStart, customEnd]);

  useEffect(() => {
    setSelectAll(allPlans.length > 0 && selectedRows.length === allPlans.length);
  }, [selectedRows, allPlans.length]);

  const formatDate = (date) => {
    if (!date) return "--";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "--";

    // Using local date parts to avoid timezone shifts
    const day = d.getDate().toString().padStart(2, "0");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
  };

  const getRowId = (member, plan) => `${member.uid}_${plan.id}`;

  const toggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
      setSelectAll(false);
      return;
    }

    const allIds = allPlans.map(({ member, plan }) => getRowId(member, plan));
    setSelectedRows(allIds);
    setSelectAll(true);
  };

  const exportToExcel = () => {
    const rowsToExport = selectedRows.length
      ? allPlans.filter(({ member, plan }) => selectedRows.includes(getRowId(member, plan)))
      : allPlans;

    if (rowsToExport.length === 0) {
      toast.error("No payment rows found to export");
      return;
    }

    const selectedData = rowsToExport.map(({ member, plan }, index) => ({
      "S.No": index + 1,
      Name: member.username,
      Email: member.email,
      Plan: plan.planName,
      "Collected By": plan.referredBy || "Admin",
      Amount: plan.pricePaid,
      "Payment Date": formatDate(plan.paymentDate),
      "Start Date": formatDate(plan.startDate),
      "End Date": formatDate(plan.endDate),
      Status: plan.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(selectedData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");

    XLSX.writeFile(workbook, "payments.xlsx");
  };

  const excelDateToJSDate = (value) => {
    if (!value) return null;

    // If already string date
    if (typeof value === "string") {
      return value;
    }

    // If Excel serial number
    const utc_days = Math.floor(value - 25569);
    const utc_value = utc_days * 86400;
    const date = new Date(utc_value * 1000);

    return date.toISOString().split("T")[0];
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const data = new Uint8Array(evt.target.result);

      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];

      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("Imported Data:", jsonData);

      try {
        for (const row of jsonData) {
          await api.post(MEMBERS_API, {
            name: row.Name,
            username: row.Name,
            phone: String(row.Mobile || ""),
            email: row.Email,
            plan: row.Plan,
            amount: row.Amount,
            joinDate: excelDateToJSDate(row["Start Date"]),
            expiryDate: excelDateToJSDate(row["End Date"]),
            status: row.Status || "active",
          });
        }

        toast.success("Excel imported successfully");

        window.location.reload();
      } catch (error) {
        console.error(error);
        toast.error("Import failed");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  if (loading && !cache[cacheKey]) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
          <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
        </div>
        <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">
          Processing Transactions
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen p-4 md:p-8 text-white">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold"></h1>

          {/* Right Section */}
          <div className="flex flex-wrap items-center gap-3 mb-5 ml-auto">
            {/* Import Excel */}
            <label className="px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm cursor-pointer hover:bg-blue-600 transition">
              Import Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            {/* Export Excel */}
            <button
              onClick={exportToExcel}
              className="px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition"
            >
              Export
            </button>

            <button
              onClick={toggleSelectAll}
              className="px-4 py-2.5 bg-slate-500 text-white rounded-lg text-sm hover:bg-slate-600 transition"
            >
              {selectAll ? "Clear Selection" : "Select All"}
            </button>

            {/* Toggle Buttons */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewType("table")}
                className={`p-2 rounded-lg transition-all ${
                  viewType === "table"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
                title="Table View"
              >
                <List size={20} />
              </button>

              <button
                onClick={() => setViewType("card")}
                className={`p-2 rounded-lg transition-all ${
                  viewType === "card"
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
                title="Card View"
              >
                <LayoutGrid size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH + FILTERS SAME ROW */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* LEFT → SEARCH */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2 rounded-lg bg-white/10 border border-white/20"
            />
          </div>

          {/* RIGHT → FILTER BUTTONS */}
          <div className="flex flex-wrap gap-4 md:justify-end items-center">
            {/* Date Filters */}
            <div className="flex items-center bg-white/5 border border-white/20 rounded-xl p-1 gap-1">
              <div className="px-3 text-gray-400 border-r border-white/10 hidden lg:block">
                <Calendar size={16} />
              </div>
              {[
                "all",
                "today",
                "yesterday",
                "this week",
                "this month",
                "custom",
              ].map((df) => (
                <button
                  key={df}
                  onClick={() => setDateFilter(df)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    dateFilter === df
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {df.charAt(0).toUpperCase() + df.slice(1)}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs */}
            {dateFilter === "custom" && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/20 rounded-xl p-1 animate-in slide-in-from-right-2 duration-300">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-transparent border-none text-xs text-white focus:ring-0 px-2 py-1 cursor-pointer"
                />
                <span className="text-gray-500 text-xs">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-transparent border-none text-xs text-white focus:ring-0 px-2 py-1 cursor-pointer"
                />
              </div>
            )}

            {/* Status Filters */}
            <div className="flex items-center bg-white/5 border border-white/20 rounded-xl p-1 gap-1">
              {["all", "active", "inactive", "expiry"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                    filterType === type
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= SUMMARY CARDS ================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Plans</p>
              <p className="text-2xl font-bold">{counts.all}</p>
            </div>
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <Users size={24} />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Active</p>
              <p className="text-2xl font-bold">{counts.active}</p>
            </div>
            <div className="p-3 bg-green-500/20 text-green-400 rounded-xl">
              <CheckCircle size={24} />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Inactive</p>
              <p className="text-2xl font-bold">{counts.inactive}</p>
            </div>
            <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
              <XCircle size={24} />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Expiring Soon</p>
              <p className="text-2xl font-bold">{counts.expiry}</p>
            </div>
            <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-xl">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        {/* ================= GRID VIEW ================= */}
        {viewType === "card" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedPlans.map(({ member, plan }, index) => {
              const totalAmount =
                plan.price || plan.totalPrice || plan.planPrice || plan.pricePaid;

              return (
                <div
                  key={`${member.uid}_${plan.id}`}
                  className="relative bg-white/10 border border-white/20 rounded-xl p-6"
                >
                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 text-xs rounded-full border ${
                          plan.status === "active"
                            ? "bg-green-500/20 text-green-400 border-green-400/30"
                            : "bg-gray-500/20 text-gray-300 border-gray-400/30"
                        }`}
                      >
                        {plan.status === "active" ? "Active" : "Inactive"}
                      </span>
                      {(() => {
                        const status = plan.paymentStatus;
                        if (status === "Paid") return <span className="px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Paid</span>;
                        if (status === "Pending") return <span className="px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-red-500/20 text-red-400 border border-red-500/20">Pending</span>;
                        if (status === "Partial") return <span className="px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">Partial</span>;
                        return null;
                      })()}
                    </div>

                  {/* <div>
                {getSerialNumber(index)}
              </div> */}

                  <p className="text-lg font-semibold">
                    {member.username || "No Name"}
                  </p>
                  <p className="text-sm text-gray-300 mb-4">{member.email}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Plan</p>
                      <p>{plan.planName}</p>
                    </div>

                    <div>
                      <p className="text-gray-400">Original Price</p>
                      <p>₹ {plan.amount || plan.price || 0}</p>
                    </div>

                    <div>
                      <p className="text-gray-400">Discount</p>
                      <p className="text-red-400">₹ {plan.discount || 0}</p>
                    </div>

                    <div>
                      <p className="text-gray-400">Final Price</p>
                      <p>₹ {plan.price || 0}</p>
                    </div>

                    <div>
                      <p className="text-gray-400">Amount Paid</p>
                      <p className="text-green-400 font-semibold">₹ {plan.pricePaid}</p>
                    </div>

                    <div>
                      <p className="text-gray-400">Start Date</p>
                      <p className="whitespace-nowrap">
                        {formatDate(plan.startDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">Remaining Days</p>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          getRemainingDays(plan.endDate) === "Expired"
                            ? "bg-red-500/20 text-red-400"
                            : isExpiringPlan(plan.endDate)
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {getRemainingDays(plan.endDate)}
                      </span>
                    </div>

                    <div>
                      <p className="text-gray-400">End Date</p>
                      <p className="whitespace-nowrap">
                        {formatDate(plan.endDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">Payment Date</p>
                      <p className="whitespace-nowrap text-purple-300">
                        {formatDate(plan.paymentDate) !== "--" ? formatDate(plan.paymentDate) : <span className="text-gray-500">--</span>}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-400">Collected By</p>
                      <p className="font-semibold text-orange-400">
                        {plan.referredBy || "Admin"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      onClick={() => handlePrintReceipt(member, plan)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm transition"
                    >
                      <FaPrint />
                    </button>
                    {plan.status === "active" ? (
                      <button
                        onClick={() =>
                          handleStatusChange(member.uid, plan.id, "inactive")
                        }
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm transition"
                      >
                        Refund & Inactive
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleStatusChange(member.uid, plan.id, "active")
                        }
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-sm transition"
                      >
                        Mark Active
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewType === "table" && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden custom-scrollbar">
            <div className="overflow-x-auto">
              <table className="w-full min-w-250 text-sm text-left text-gray-200 border-collapse">
                <thead className="bg-white/10 text-white">
                  <tr>
                    <th className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 bg-transparent border-white/20 rounded focus:ring-orange-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">S.No</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Name</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">Plan</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">PT Plan</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Collected By</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Original Price</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Discount</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Total Amount</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Initial Amount</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold">Second Payment</th>
                    
                    <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">Normal Validity</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">PT Validity</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">Payment Date</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold">Payment</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold">Status / Action</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPlans.map(({ member, plan }, index) => {
                    const totalAmount =
                      plan.price || plan.totalPrice || plan.planPrice || plan.pricePaid;
                    const paidTotal = Number(plan.pricePaid || 0) + Number(plan.secondPaymentPaid || 0);
                    const remainingAmount = Math.max(0, Number(totalAmount) - paidTotal);

                    return (
                      <tr
                        key={`${member.uid}_${plan.id}`}
                        className="border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-all group"
                      >
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(getRowId(member, plan))}
                            onChange={() => toggleRow(getRowId(member, plan))}
                            className="w-4 h-4 bg-transparent border-white/20 rounded focus:ring-orange-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4 text-base font-medium text-gray-400">
                          {getSerialNumber(index)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-base font-medium text-white group-hover:text-orange-400 transition-colors">
                            {member.username}
                          </div>
                          <div className="text-[11px] text-gray-400 mt-1">
                            {member.email}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-orange-500/20 text-orange-400 inline-block whitespace-nowrap">
                            {plan.planName || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {plan.pt_planName ? (
                            <span className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-purple-500/20 text-purple-400 inline-flex items-center gap-1 whitespace-nowrap">
                              ✓ {plan.pt_planName}
                            </span>
                          ) : plan.planName?.toLowerCase().includes("pt") ? (
                            <span className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-purple-500/20 text-purple-400 inline-flex items-center gap-1 whitespace-nowrap">
                              ✓ {plan.planName}
                            </span>
                          ) : (
                            <span className="text-white/30 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-base font-medium text-orange-400">
                          {plan.referredBy || "Admin"}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-base font-medium text-white/60">
                            ₹{plan.amount || plan.price || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-base font-medium text-red-400">
                            ₹{plan.discount || 0}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-base font-medium text-orange-400">
                            ₹{totalAmount}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-base font-medium text-green-400">
                            ₹{plan.pricePaid}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-base font-medium text-cyan-300">
                            ₹{plan.secondPaymentPaid || 0}
                          </span>
                        </td>
                       
                        <td className="px-4 py-4 text-white/70 text-xs font-medium whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            {plan.planName && (!plan.planName?.toLowerCase().includes("pt") || plan.pt_planName) ? (
                              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10 w-max">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded self-center bg-orange-500/20 text-orange-400`}>
                                  NRM
                                </span>
                                <div className="flex flex-col text-[11px] text-gray-300 gap-0.5">
                                  <div><span className="text-gray-500 font-medium">S-</span> {formatDate(plan.startDate)}</div>
                                  <div><span className="text-gray-500 font-medium">E-</span> {formatDate(plan.endDate)}</div>
                                </div>
                                <div className="flex items-center ml-1 border-l border-white/10 pl-3">
                                  {plan.endDate ? (
                                    getRemainingDays(plan.endDate) === "Expired" ? (
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase">
                                        EXPIRED
                                      </span>
                                    ) : (
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                        isExpiringPlan(plan.endDate) ? "bg-yellow-500/20 text-yellow-400" : "bg-emerald-500/20 text-emerald-400"
                                      }`}>
                                        {getRemainingDays(plan.endDate).replace(' days', 'D').replace(' day', 'D')} LEFT
                                      </span>
                                    )
                                  ) : null}
                                </div>
                              </div>
                            ) : <span className="text-white/30">-</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-white/70 text-xs font-medium whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            {plan.pt_planName || plan.pt_startDate || plan.pt_endDate || plan.planName?.toLowerCase().includes("pt") ? (
                              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/10 w-max">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded self-center bg-purple-500/20 text-purple-400`}>
                                  PT
                                </span>
                                <div className="flex flex-col text-[11px] text-gray-300 gap-0.5">
                                  <div><span className="text-gray-500 font-medium">S-</span> {formatDate(plan.pt_startDate || (plan.planName?.toLowerCase().includes("pt") ? plan.startDate : null))}</div>
                                  <div><span className="text-gray-500 font-medium">E-</span> {formatDate(plan.pt_endDate || (plan.planName?.toLowerCase().includes("pt") ? plan.endDate : null))}</div>
                                </div>
                                <div className="flex items-center ml-1 border-l border-white/10 pl-3">
                                  {(plan.pt_endDate || (plan.planName?.toLowerCase().includes("pt") && plan.endDate)) ? (
                                    getRemainingDays(plan.pt_endDate || plan.endDate) === "Expired" ? (
                                      <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase">
                                        EXPIRED
                                      </span>
                                    ) : (
                                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                        isExpiringPlan(plan.pt_endDate || plan.endDate) ? "bg-yellow-500/20 text-yellow-400" : "bg-purple-500/20 text-purple-400"
                                      }`}>
                                        {getRemainingDays(plan.pt_endDate || plan.endDate).replace(' days', 'D').replace(' day', 'D')} LEFT
                                      </span>
                                    )
                                  ) : null}
                                </div>
                              </div>
                            ) : <span className="text-white/30">-</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-base whitespace-nowrap">
                          {plan.paymentDate
                            ? <span className="text-purple-300">{formatDate(plan.paymentDate)}</span>
                            : <span className="text-gray-600">--</span>
                          }
                        </td>
                        <td className="px-4 py-4 text-center">
                          {(() => {
                            const status = plan.paymentStatus;
                            if (status === "Paid") return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Paid</span>;
                            if (status === "Pending") return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/20">Pending</span>;
                            if (status === "Partial") return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">Partial</span>;
                            return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-500/20 text-gray-400 border border-gray-500/20">{status || "--"}</span>;
                          })()}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  member.uid,
                                  plan.id,
                                  plan.status === "active"
                                    ? "inactive"
                                    : "active",
                                )
                              }
                              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                                plan.status === "active"
                                  ? "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500 hover:text-white"
                                  : "bg-white/5 text-white/40 border-white/10 hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/30"
                              }`}
                            >
                              {plan.status || "Active"}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handlePrintReceipt(member, plan)}
                            className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500 hover:text-white transition-all inline-flex"
                            title="Print Receipt"
                          >
                            <FaPrint size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= PAGINATION ================= */}
        {totalPages > 1 && (
          <div className="flex justify-end items-center gap-2 mt-8 flex-wrap">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-3 py-1 rounded bg-white/10 border border-white/20"
              disabled={currentPage === 1}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded border ${
                  currentPage === page
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white/10 border-white/20"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              className="px-3 py-1 rounded bg-white/10 border border-white/20"
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default Payments;
