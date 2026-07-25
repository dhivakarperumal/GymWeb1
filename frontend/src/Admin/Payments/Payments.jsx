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

// Helper function to calculate next payment date based on initial payment date
const calculateNextPaymentDate = (plan) => {
  // Get the base date - either paymentDate or createdAt
  const baseDate = plan.paymentDate 
    ? new Date(plan.paymentDate)
    : plan.createdAt
      ? new Date(plan.createdAt)
      : new Date();
  
  // Add 30 days to the base date
  const nextDueDate = new Date(baseDate);
  nextDueDate.setDate(nextDueDate.getDate() + 30);
  
  return nextDueDate;
};

const Payments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profileName } = useAuth();
  
  const isTrainerPanel = location.pathname.startsWith("/trainer");
  const cacheKey = isTrainerPanel ? `trainerPayments_${user?.id}` : "adminPayments";

  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [paymentTab, setPaymentTab] = useState("all");
  const [planTypeTab, setPlanTypeTab] = useState("normal");
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
        // For trainer panel, also fetch assignments to know which members belong to this trainer
        let assignedUserIds = new Set();
        if (isTrainerPanel && user?.id) {
          try {
            const assignRes = await api.get(`/assignments?trainerUserId=${user.id}`);
            const assignData = Array.isArray(assignRes.data)
              ? assignRes.data
              : assignRes.data?.data || assignRes.data?.assignments || [];
            assignData.forEach((a) => {
              const uid = String(a.userId || a.user_id || a.uid || "");
              const gmId = String(a.gymMemberId || a.gym_member_id || "");
              if (uid && uid !== "undefined" && uid !== "null") assignedUserIds.add(uid);
              if (gmId && gmId !== "undefined" && gmId !== "null") assignedUserIds.add(gmId);
            });
          } catch (err) {
            console.warn("Could not fetch assignments for trainer:", err);
          }
        }

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
          // If on trainer panel, filter strictly by assigned members only
          if (isTrainerPanel) {
            const memberUserId = String(m.userId || "");

            if (!assignedUserIds.has(memberUserId)) {
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
            pt_price: m.pt_price || 0,
            pt_pricePaid: m.pt_pricePaid || 0,
            pt_secondPaymentPaid: m.pt_secondPaymentPaid || 0,
            pt_amount: m.pt_amount || 0,
            pt_discount: m.pt_discount || 0,
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
    end.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    return diff <= 7 && diff >= 0;
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

  const isEmiPlan = (plan) =>
    String(plan?.paymentMode || "").trim().toLowerCase().startsWith("emi");

  const isFullPayment = (plan) => {
    const totalPrice = (Number(plan.amount) || Number(plan.price) || 0) + (Number(plan.pt_amount) || Number(plan.pt_price) || 0);
    const totalDiscount = (Number(plan.discount) || 0) + (Number(plan.pt_discount) || 0);
    const finalPrice = totalPrice - totalDiscount;
    const initialPaid = Number(plan.pricePaid) || 0;
    return initialPaid >= finalPrice && finalPrice > 0;
  };

  const matchesPaymentTab = (plan) => {
    if (paymentTab === "emi") return isEmiPlan(plan);
    if (paymentTab === "full") return isFullPayment(plan) && !isEmiPlan(plan);
    return true;
  };

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

    const planPrice     = Number(plan.amount) || Number(plan.price) || 0;
    const ptPrice       = Number(plan.pt_amount) || Number(plan.pt_price) || 0;
    const discount      = (Number(plan.discount) || 0) + (Number(plan.pt_discount) || 0);
    const originalPrice = planPrice + ptPrice;
    const totalAmount   = planPrice + ptPrice - discount;

    const pricePaid     = (Number(plan.pricePaid) || 0) + (Number(plan.pt_pricePaid) || 0);
    const secondPayment = (Number(plan.secondPaymentPaid) || 0) + (Number(plan.pt_secondPaymentPaid) || 0);
    const totalPaid     = pricePaid + secondPayment;
    const balance       = Math.max(0, totalAmount - totalPaid);

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
      const filterDate = plan.paymentDate || plan.createdAt;
      let passDate = true;
      if (dateFilter === "today" && !isToday(filterDate)) passDate = false;
      if (dateFilter === "yesterday" && !isYesterday(filterDate))
        passDate = false;
      if (dateFilter === "this week" && !isThisWeek(filterDate))
        passDate = false;
      if (dateFilter === "this month" && !isThisMonth(filterDate))
        passDate = false;
      if (dateFilter === "custom" && !isInCustomRange(filterDate))
        passDate = false;

      const hasValidPTAddon = plan.pt_planName && plan.pt_planName !== "null" && plan.pt_planName !== "undefined" && plan.pt_planName.trim() !== "";
      const isPTPrimary = plan.planName && /\bpt\b/i.test(plan.planName);
      
      let passPlanType = true;
      if (planTypeTab === "normal") {
        const hasNormal = plan.planName && (!isPTPrimary || hasValidPTAddon);
        if (!hasNormal) passPlanType = false;
      } else if (planTypeTab === "pt") {
        const hasPT = hasValidPTAddon || isPTPrimary;
        if (!hasPT) passPlanType = false;
      }

      if (passDate && matchesPaymentTab(plan) && passPlanType) {
        allInitialPlans.push(plan);
      }
    });
  });

  const getPlanEndDate = (p) => {
    const hasValidPTAddon = p.pt_planName && p.pt_planName !== "null" && p.pt_planName !== "undefined" && p.pt_planName.trim() !== "";
    return planTypeTab === "pt" && hasValidPTAddon ? (p.pt_endDate || p.endDate) : p.endDate;
  };

  const counts = {
    all: allInitialPlans.length,
    active: allInitialPlans.filter((p) => p.status === "active").length,
    inactive: allInitialPlans.filter((p) => p.status === "inactive").length,
    expiry: allInitialPlans.filter((p) => isExpiringPlan(getPlanEndDate(p))).length,
  };

  const filteredMembers = members
    .map((member) => ({
      ...member,
      plans: member.plans.filter((plan) => {
        const q = search.toLowerCase().trim();

        let match = true;
        if (q) {
          match =
            member.username?.toLowerCase().includes(q) ||
            member.email?.toLowerCase().includes(q) ||
            plan.planName?.toLowerCase().includes(q) ||
            plan.pt_planName?.toLowerCase().includes(q) ||
            plan.phone?.toLowerCase().includes(q) ||
            member.phone?.toLowerCase().includes(q) ||
            member.phoneNumber?.toLowerCase().includes(q);
        }

        if (!match) return false;

        // Payment Tab Filter
        if (!matchesPaymentTab(plan)) return false;

        // Plan Type Filter
        const hasValidPTAddon = plan.pt_planName && plan.pt_planName !== "null" && plan.pt_planName !== "undefined" && plan.pt_planName.trim() !== "";
        const isPTPrimary = plan.planName && /\bpt\b/i.test(plan.planName);

        if (planTypeTab === "normal") {
          const hasNormal = plan.planName && (!isPTPrimary || hasValidPTAddon);
          if (!hasNormal) return false;
        } else if (planTypeTab === "pt") {
          const hasPT = hasValidPTAddon || isPTPrimary;
          if (!hasPT) return false;
        }

        // Status Filter
        if (filterType === "active" && plan.status !== "active") return false;
        if (filterType === "inactive" && plan.status !== "inactive")
          return false;
        
        const currentEndDate = planTypeTab === "pt" && hasValidPTAddon ? (plan.pt_endDate || plan.endDate) : plan.endDate;
        if (filterType === "expiry" && !isExpiringPlan(currentEndDate))
          return false;

        // Date Filter
        const filterDate = plan.paymentDate || plan.createdAt;
        if (dateFilter === "today" && !isToday(filterDate)) return false;
        if (dateFilter === "yesterday" && !isYesterday(filterDate))
          return false;
        if (dateFilter === "this week" && !isThisWeek(filterDate))
          return false;
        if (dateFilter === "this month" && !isThisMonth(filterDate))
          return false;
        if (dateFilter === "custom" && !isInCustomRange(filterDate))
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
  }, [search, filterType, paymentTab, planTypeTab, dateFilter, customStart, customEnd]);

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
           {/* LEFT → SEARCH */}
          <div className="relative w-full xl:max-w-sm shrink-0">
            <Search className="absolute left-4 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or plan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2 rounded-lg bg-white/10 border border-white/20"
            />
          </div>

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
        <div className="mb-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
         {/* Plan Type Tabs */}
            <div className="flex items-center bg-white/5 border border-white/20 rounded-xl p-1 gap-1 shrink-0">
              {[
                { key: "normal", label: "Normal Plan" },
                { key: "pt", label: "PT Plan" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPlanTypeTab(tab.key)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    planTypeTab === tab.key
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          {/* RIGHT → FILTER BUTTONS */}
          <div className="flex flex-nowrap overflow-x-auto gap-3 xl:justify-end items-center w-full pb-2 custom-scrollbar">
           
          
            {/* Date Filters */}
            <div className="flex items-center bg-white/5 border border-white/20 rounded-xl px-2 py-2 gap-2 shrink-0">
              <div className="text-gray-400 hidden lg:block">
                <Calendar size={16} />
              </div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="!bg-transparent bg-transparent border-none text-xs font-medium text-gray-300 focus:ring-0 cursor-pointer outline-none"
              >
                <option value="all" className="bg-gray-900 text-white">All Time</option>
                <option value="today" className="bg-gray-900 text-white">Today</option>
                <option value="yesterday" className="bg-gray-900 text-white">Yesterday</option>
                <option value="this week" className="bg-gray-900 text-white">This week</option>
                <option value="this month" className="bg-gray-900 text-white">This month</option>
                <option value="custom" className="bg-gray-900 text-white">Custom</option>
              </select>
            </div>
           

            {/* Custom Range Inputs */}
            {dateFilter === "custom" && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/20 rounded-xl p-1 animate-in slide-in-from-right-2 duration-300 shrink-0">
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


            

            {/* Payment Type Filters */}
            <div className="flex items-center bg-white/5 border border-white/20 rounded-xl p-1 gap-1 shrink-0">
              {[
                { key: "all", label: "All" },
                { key: "full", label: "Full Payment" },
                { key: "emi", label: "EMI" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setPaymentTab(tab.key)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    paymentTab === tab.key
                      ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status Filters */}
             <div className="flex items-center bg-white/5 border border-white/20 rounded-xl p-1 gap-1 shrink-0">
              {["all", "active", "inactive", "expiry"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
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
          paginatedPlans.length > 0 ? (
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
                      <p>₹ {(Number(plan.amount) || Number(plan.price) || 0) + (Number(plan.pt_amount) || Number(plan.pt_price) || 0)}</p>
                    </div>

                    <div>
                      <p className="text-gray-400">Discount</p>
                      <p className="text-red-400">₹ {(Number(plan.discount) || 0) + (Number(plan.pt_discount) || 0)}</p>
                    </div>

                    <div>
                      <p className="text-gray-400">Final Price</p>
                      <p>₹ {(Number(plan.price) || 0) + (Number(plan.pt_price) || 0)}</p>
                    </div>

                    <div>
                      <p className="text-gray-400">Amount Paid</p>
                      <p className="text-green-400 font-semibold">₹ {(Number(plan.pricePaid) || 0) + (Number(plan.pt_pricePaid) || 0)}</p>
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

                    {String(plan.paymentMode || "").toLowerCase().startsWith("emi") || plan.paymentStatus === "Partial" ? (
                      <div>
                        <p className="text-gray-400">Next Payment Due</p>
                        <p className="whitespace-nowrap text-blue-400 font-semibold">
                          {(() => {
                            const nextDate = calculateNextPaymentDate(plan);
                            return nextDate.toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            });
                          })()}
                        </p>
                      </div>
                    ) : null}

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
                    {/* {plan.status === "active" ? (
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
                    )} */}
                  </div>
                </div>
              );
            })}
          </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/10 rounded-2xl">
              <div className="p-4 bg-white/5 rounded-full mb-4">
                <Search size={32} className="text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-300">No payments found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search query</p>
            </div>
          )
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
                    <th className="px-4 py-4 text-left text-sm font-semibold">Member Info</th>
                    {planTypeTab === "pt" ? (
                      <>
                        <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">PT Plan Name</th>
                        <th className="px-4 py-4 text-left text-sm font-semibold">Collected By</th>
                        <th className="px-4 py-4 text-left text-sm font-semibold">PT Price</th>
                        <th className="px-4 py-4 text-left text-sm font-semibold">PT Discount</th>
                        {paymentTab === "emi" && <th className="px-4 py-4 text-left text-sm font-semibold">PT Initial Amount</th>}
                        <th className="px-4 py-4 text-left text-sm font-semibold">PT Second Payment</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">Plan</th>
                        <th className="px-4 py-4 text-left text-sm font-semibold">Collected By</th>
                        <th className="px-4 py-4 text-left text-sm font-semibold">Price</th>
                        <th className="px-4 py-4 text-left text-sm font-semibold">Discount</th>
                        {paymentTab === "emi" && <th className="px-4 py-4 text-left text-sm font-semibold">Initial Amount</th>}
                        <th className="px-4 py-4 text-left text-sm font-semibold">Second Payment</th>
                      </>
                    )}
                    <th className="px-4 py-4 text-left text-sm font-semibold text-orange-400">Remaining Amount</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold text-blue-400">Total Payable</th>
                    
                    <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">Validity</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">Payment Date</th>
                    <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">Next Payment Due</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold">Payment</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold">Status / Action</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPlans.length > 0 ? (
                    paginatedPlans.map(({ member, plan }, index) => {
                      const isPTTab = planTypeTab === "pt";
                      
                      const planPrice = isPTTab 
                        ? (Number(plan.pt_amount) || Number(plan.pt_price) || 0) 
                        : (Number(plan.amount) || Number(plan.price) || 0);
                      const totalDiscount = isPTTab 
                        ? (Number(plan.pt_discount) || 0) 
                        : (Number(plan.discount) || 0);
                      const totalAmount = planPrice - totalDiscount;
                      
                      const initialPaid = isPTTab 
                        ? (Number(plan.pt_pricePaid) || 0) 
                        : (Number(plan.pricePaid) || 0);
                      const secondPaid = isPTTab 
                        ? (Number(plan.pt_secondPaymentPaid) || 0) 
                        : (Number(plan.secondPaymentPaid) || 0);
                        
                      const paidTotal = initialPaid + secondPaid;
                      const remainingAmount = Math.max(0, totalAmount - paidTotal);

                      const isValidPTAddon = plan.pt_planName && plan.pt_planName !== "null" && plan.pt_planName !== "undefined" && plan.pt_planName.trim() !== "";
                      const planNameDisplay = isPTTab
                        ? (isValidPTAddon ? plan.pt_planName : plan.planName)
                        : plan.planName;

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
                          <div className="text-xs text-white/50 mt-1 flex flex-col gap-0.5">
                            <div>
                              {plan.phone || "N/A"}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {member.email || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-orange-500/20 text-orange-400 inline-block whitespace-nowrap">
                            {planNameDisplay || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-base font-medium text-orange-400">
                          {plan.referredBy || "Admin"}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-base font-medium text-white/60">
                            ₹{planPrice}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-base font-medium text-red-400">
                            ₹{totalDiscount}
                          </span>
                        </td>
                        {paymentTab === "emi" && <td className="px-4 py-4">
                          <span className="text-base font-medium text-white/80">
                            ₹{initialPaid}
                          </span>
                        </td>}
                        <td className="px-4 py-4">
                          <span className="text-base font-medium text-cyan-300">
                            ₹{secondPaid}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-base font-bold text-orange-400">
                            ₹{remainingAmount}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-base font-bold text-blue-400">
                            ₹{totalAmount}
                          </span>
                        </td>
                       
                        <td className="px-4 py-4 text-white/70 text-xs font-medium whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            {!isPTTab ? (
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
                                        {getRemainingDays(plan.endDate) === "Last Day" ? "LAST DAY" : `${getRemainingDays(plan.endDate).replace(' days', 'D').replace(' day', 'D')} LEFT`}
                                      </span>
                                    )
                                  ) : null}
                                </div>
                              </div>
                            ) : (
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
                                        {getRemainingDays(plan.pt_endDate || plan.endDate) === "Last Day" ? "LAST DAY" : `${getRemainingDays(plan.pt_endDate || plan.endDate).replace(' days', 'D').replace(' day', 'D')} LEFT`}
                                      </span>
                                    )
                                  ) : null}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-base whitespace-nowrap">
                          {plan.paymentDate
                            ? <span className="text-purple-300">{formatDate(plan.paymentDate)}</span>
                            : <span className="text-gray-600">--</span>
                          }
                        </td>
                        <td className="px-4 py-4 font-medium text-base whitespace-nowrap">
                          {String(plan.paymentMode || "").toLowerCase().startsWith("emi") || plan.paymentStatus === "Partial" ? (
                            <span className="text-blue-400">
                              {(() => {
                                const nextDate = calculateNextPaymentDate(plan);
                                return nextDate.toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                });
                              })()}
                            </span>
                          ) : <span className="text-gray-600">--</span>}
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
                  })
                  ) : (
                    <tr>
                      <td colSpan="18" className="px-4 py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="p-3 bg-white/5 rounded-full mb-3">
                            <Search size={24} className="text-gray-400" />
                          </div>
                          <p className="text-base font-medium text-gray-300">No payments found</p>
                          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search query</p>
                        </div>
                      </td>
                    </tr>
                  )}
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

            {(() => {
              let startPage = Math.max(1, currentPage - 2);
              let endPage = Math.min(totalPages, startPage + 4);

              if (endPage - startPage < 4) {
                startPage = Math.max(1, endPage - 4);
              }

              const pages = [];
              
              if (startPage > 1) {
                pages.push(
                  <button key="first" onClick={() => setCurrentPage(1)} className="px-3 py-1 rounded border bg-white/10 border-white/20 hover:bg-white/20 transition">1</button>
                );
                if (startPage > 2) {
                  pages.push(<span key="ellipsis-start" className="px-2 text-white/50">...</span>);
                }
              }

              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-1 rounded border transition ${
                      currentPage === i
                        ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                        : "bg-white/10 border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {i}
                  </button>
                );
              }

              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(<span key="ellipsis-end" className="px-2 text-white/50">...</span>);
                }
                pages.push(
                  <button key="last" onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 rounded border bg-white/10 border-white/20 hover:bg-white/20 transition">{totalPages}</button>
                );
              }

              return pages;
            })()}

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
