import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ArrowLeft, Download, LayoutList, LayoutGrid,
  Calendar, IndianRupee, CheckCircle2, Clock, XCircle
} from "lucide-react";
import * as XLSX from "xlsx";
import api from "../../api";

const PlanHistory = () => {
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const res = await api.get("/memberships");
        setMemberships(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load plan history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const parseDecimal = (v) => {
    const n = Number(v);
    return isFinite(n) ? n : 0;
  };

  const formatDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    if (isNaN(date)) return "—";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const isThisMonth = (d) => {
    if (!d) return false;
    const date = new Date(d);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  const isThisWeek = (d) => {
    if (!d) return false;
    const date = new Date(d);
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return date >= start;
  };

  const isToday = (d) => {
    if (!d) return false;
    return new Date(d).toDateString() === new Date().toDateString();
  };

  const isExpired = (m) => {
    // Handle both camelCase and snake_case field names from MySQL
    const endDate = m.endDate || m.end_date || m.EndDate;
    if (!endDate) return false;
    const end = new Date(endDate);
    if (isNaN(end)) return false;
    end.setHours(23, 59, 59, 999);
    // Show if end date passed OR if explicitly inactive
    return end < new Date() || m.status === 'inactive';
  };

  const filtered = memberships.filter((m) => {
    // Only show completed/expired plans
    if (!isExpired(m)) return false;

    const q = search.toLowerCase();
    const matchSearch =
      (m.userName || m.username || "").toLowerCase().includes(q) ||
      (m.userEmail || m.email || "").toLowerCase().includes(q) ||
      (m.planName || "").toLowerCase().includes(q);
    if (!matchSearch) return false;

    if (statusFilter !== "all" && m.status !== statusFilter) return false;

    if (paymentFilter === "emi" && m.paymentMode !== "emi") return false;
    if (paymentFilter === "full" && m.paymentMode === "emi") return false;

    if (dateFilter === "today" && !isToday(m.createdAt)) return false;
    if (dateFilter === "week" && !isThisWeek(m.createdAt)) return false;
    if (dateFilter === "month" && !isThisMonth(m.createdAt)) return false;

    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, paymentFilter, dateFilter]);

  // Summary stats
  const totalRevenue = filtered.reduce((acc, m) => acc + parseDecimal(m.price), 0);
  const totalCollected = filtered.reduce((acc, m) => acc + parseDecimal(m.pricePaid) + parseDecimal(m.secondPaymentPaid), 0);
  const totalRemaining = Math.max(0, totalRevenue - totalCollected);
  const activeCount = filtered.filter((m) => m.status === "active").length;

  const exportToExcel = () => {
    const data = filtered.map((m, i) => {
      const total = parseDecimal(m.price);
      const paid = parseDecimal(m.pricePaid) + parseDecimal(m.secondPaymentPaid);
      return {
        "S.No": i + 1,
        Member: m.userName || m.username || "—",
        Email: m.userEmail || m.email || "—",
        Plan: m.planName || "—",
        "Total Price": total,
        "Initial Paid": parseDecimal(m.pricePaid),
        "Second Paid": parseDecimal(m.secondPaymentPaid),
        "Remaining": Math.max(0, total - paid),
        "Payment Mode": m.paymentMode || "—",
        "Start Date": formatDate(m.startDate),
        "End Date": formatDate(m.endDate),
        Status: m.status || "—",
        "Created At": formatDate(m.createdAt),
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plan History");
    XLSX.writeFile(wb, "plan_complete_history.xlsx");
  };

  const getPaymentBadge = (mode) => {
    if (mode === "emi") return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/20">EMI</span>;
    if (mode === "upi") return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/20">UPI</span>;
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Cash</span>;
  };

  const getStatusBadge = (status) => {
    if (status === "active") return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-500/20 text-green-400 border border-green-500/20"><CheckCircle2 size={10} /> Active</span>;
    if (status === "inactive") return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/20"><XCircle size={10} /> Inactive</span>;
    return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-500/20 text-gray-400 border border-gray-500/20"><Clock size={10} /> {status || "—"}</span>;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 text-white">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/settings")}
          className="p-2 rounded-full bg-white/10 hover:bg-orange-500/20 hover:text-orange-400 transition-all border border-white/10"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Plan History</h1>
          <p className="text-white/40 text-sm">Detailed history of all member plans and payments</p>
        </div>
        <button
          onClick={exportToExcel}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl text-sm font-semibold hover:bg-green-500 hover:text-white transition-all"
        >
          <Download size={16} /> Export Excel
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Plans", value: filtered.length, color: "blue", icon: <LayoutList size={20} /> },
          { label: "Active Plans", value: activeCount, color: "green", icon: <CheckCircle2 size={20} /> },
          { label: "Total Revenue", value: `₹${totalRevenue.toFixed(2)}`, color: "orange", icon: <IndianRupee size={20} /> },
          { label: "Remaining Due", value: `₹${totalRemaining.toFixed(2)}`, color: totalRemaining > 0 ? "red" : "emerald", icon: <Clock size={20} /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-xl bg-${stat.color}-500/20 text-${stat.color}-400`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by member, email or plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/40"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {["all", "active", "inactive"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${statusFilter === s ? "bg-orange-500 text-white" : "text-white/40 hover:text-white"}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Payment Mode Filter */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {[{ v: "all", l: "All" }, { v: "full", l: "Full" }, { v: "emi", l: "EMI" }].map((f) => (
            <button key={f.v} onClick={() => setPaymentFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${paymentFilter === f.v ? "bg-purple-500 text-white" : "text-white/40 hover:text-white"}`}>
              {f.l}
            </button>
          ))}
        </div>

        {/* Date Filter */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {[{ v: "all", l: "All Time" }, { v: "today", l: "Today" }, { v: "week", l: "Week" }, { v: "month", l: "Month" }].map((f) => (
            <button key={f.v} onClick={() => setDateFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${dateFilter === f.v ? "bg-blue-500 text-white" : "text-white/40 hover:text-white"}`}>
              {f.l}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          <button onClick={() => setViewMode("table")} className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-orange-500 text-white" : "text-white/40 hover:text-white"}`}><LayoutList size={16} /></button>
          <button onClick={() => setViewMode("card")} className={`p-2 rounded-lg transition-all ${viewMode === "card" ? "bg-orange-500 text-white" : "text-white/40 hover:text-white"}`}><LayoutGrid size={16} /></button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/40">
          No completed/expired plans found matching your criteria.
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm text-left text-gray-200 border-collapse">
            <thead className="sticky top-0 bg-white/5 backdrop-blur-xl border-b border-white/10 text-white/40 uppercase text-[10px] tracking-[0.2em] font-black">
              <tr>
                <th className="px-5 py-4">S.No</th>
                <th className="px-5 py-4">Member</th>
                <th className="px-5 py-4">Plan</th>
                <th className="px-5 py-4 text-orange-400">Total Price</th>
                <th className="px-5 py-4 text-green-400">Initial Paid</th>
                <th className="px-5 py-4 text-cyan-400">Second Paid</th>
                <th className="px-5 py-4 text-blue-400">Remaining</th>
                <th className="px-5 py-4">Mode</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Start</th>
                <th className="px-5 py-4">End</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((m, idx) => {
                const endDateVal = m.endDate || m.end_date;
                const total = parseDecimal(m.price);
                const paid = parseDecimal(m.pricePaid) + parseDecimal(m.secondPaymentPaid);
                const remaining = Math.max(0, total - paid);
                
                // Payment Status Badge
                const getPaymentStatusBadge = (status) => {
                  if (status === "Paid") return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">Paid</span>;
                  if (status === "Pending") return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/20">Pending</span>;
                  if (status === "Partial") return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-500/20 text-yellow-400 border border-yellow-500/20">Partial</span>;
                  return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-500/20 text-gray-400 border border-gray-500/20">{status || "—"}</span>;
                };

                return (
                  <tr key={m.id || idx} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
                    <td className="px-5 py-4 text-white/30 font-bold">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">{m.userName || m.username || "—"}</p>
                      <p className="text-[10px] text-white/40">{m.userEmail || m.email || "—"}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-white/80">{m.planName || "—"}</td>
                    <td className="px-5 py-4 font-black text-orange-400">{total > 0 ? `₹${total.toFixed(2)}` : "—"}</td>
                    <td className="px-5 py-4 font-black text-green-400">₹{parseDecimal(m.pricePaid).toFixed(2)}</td>
                    <td className="px-5 py-4 font-black text-cyan-400">₹{parseDecimal(m.secondPaymentPaid).toFixed(2)}</td>
                    <td className="px-5 py-4 font-black">
                      {remaining > 0 ? <span className="text-blue-400">₹{remaining.toFixed(2)}</span> : <span className="text-emerald-400 text-xs font-bold">✓ Cleared</span>}
                    </td>
                    <td className="px-5 py-4">{getPaymentBadge(m.paymentMode)}</td>
                    <td className="px-5 py-4">{getPaymentStatusBadge(m.paymentStatus)}</td>
                    <td className="px-5 py-4 text-white/50 whitespace-nowrap">{formatDate(m.startDate)}</td>
                    <td className="px-5 py-4 text-white/50 whitespace-nowrap">{formatDate(m.endDate)}</td>
                    <td className="px-5 py-4">{getStatusBadge(m.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* CARD VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((m, idx) => {
            const total = parseDecimal(m.price);
            const paid = parseDecimal(m.pricePaid) + parseDecimal(m.secondPaymentPaid);
            const remaining = Math.max(0, total - paid);
            return (
              <div key={m.id || idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-orange-500/30 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-white">{m.userName || m.username || "—"}</p>
                    <p className="text-[10px] text-white/40">{m.userEmail || m.email || "—"}</p>
                  </div>
                  {getStatusBadge(m.status)}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded-lg text-xs font-semibold border border-orange-500/20">{m.planName || "—"}</span>
                  {getPaymentBadge(m.paymentMode)}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-white/5 p-2.5 rounded-xl text-center border border-white/5">
                    <p className="text-[9px] text-orange-400/70 uppercase font-black mb-1">Total</p>
                    <p className="text-xs font-bold text-orange-400">{total > 0 ? `₹${total.toFixed(0)}` : "—"}</p>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl text-center border border-white/5">
                    <p className="text-[9px] text-green-400/70 uppercase font-black mb-1">Paid</p>
                    <p className="text-xs font-bold text-green-400">₹{paid.toFixed(0)}</p>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl text-center border border-white/5">
                    <p className="text-[9px] text-blue-400/70 uppercase font-black mb-1">Due</p>
                    <p className={`text-xs font-bold ${remaining > 0 ? "text-blue-400" : "text-emerald-400"}`}>{remaining > 0 ? `₹${remaining.toFixed(0)}` : "✓"}</p>
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-white/30">
                  <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(m.startDate)}</span>
                  <span>→ {formatDate(m.endDate)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
          <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm disabled:opacity-30 hover:bg-white/10 transition-all">Prev</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button key={page} onClick={() => setCurrentPage(page)}
              className={`px-4 py-2 rounded-xl border text-sm transition-all ${currentPage === page ? "bg-orange-500 text-white border-orange-500" : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
              {page}
            </button>
          ))}
          <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm disabled:opacity-30 hover:bg-white/10 transition-all">Next</button>
        </div>
      )}
    </div>
  );
};

export default PlanHistory;
