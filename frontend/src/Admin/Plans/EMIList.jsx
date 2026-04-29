import React, { useEffect, useState } from "react";
import { Eye, Edit, X, Search, ChevronDown, Plus, LayoutGrid, List, ChevronLeft, ChevronRight, FileDown, FileUp, Download, Upload } from "lucide-react";
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

const EMIList = () => {
  const { user, role } = useAuth();
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
  const [trainerFilter, setTrainerFilter] = useState("all");
  const [trainers, setTrainers] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membershipsRes, plansRes, staffRes] = await Promise.all([
          api.get("/memberships"),
          api.get("/plans"),
          api.get("/staff"),
        ]);

        setMemberships(
          Array.isArray(membershipsRes.data) ? membershipsRes.data : [],
        );
        setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
        setTrainers(Array.isArray(staffRes.data) ? staffRes.data : []);
      } catch (err) {
        console.error("Failed to load EMI records", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

    return matchesSearch && matchesStatus && matchesDate;
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
      const totalPrice = plan
        ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price)
        : parseDecimal(m.pricePaid) * duration;
      const initialPayment = parseDecimal(m.pricePaid);
      const balanceDue = Number((totalPrice - initialPayment).toFixed(2));
      
      return {
        "S.No": index + 1,
        Member: m.userName || m.username || "N/A",
        Email: m.userEmail || m.email || "-",
        Plan: m.planName || "N/A",
        Duration: `${duration} months`,
        "Initial Payment": `₹${initialPayment.toFixed(2)}`,
        "Balance Due": `₹${balanceDue.toFixed(2)}`,
        "Total Price": `₹${totalPrice.toFixed(2)}`,
        "Payment ID": m.paymentId || "-",
        "Created At": new Date(m.createdAt).toLocaleDateString(),
        Status: m.status || "active"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "EMI Records");
    XLSX.writeFile(workbook, "emi_payments_report.xlsx");
    toast.success("EMI report exported!");
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    toast.success("Excel file received! Processing import...");
    // Logic for importing EMI could be complex, for now we log it.
    console.log("Importing file:", file.name);
  };

  const findPlanForMembership = (membership) => {
    return plans.find(
      (plan) =>
        normalizeText(plan.name) === normalizeText(membership.planName) &&
        parseDuration(plan.duration) === Number(membership.duration),
    );
  };

  const selectMembership = (membership) => {
    setSelectedMembership(membership);
    setUpdateAmount("");
    setPaymentReference("");

    // Auto-fill remaining balance amount for 30-day payment plan
    const plan = findPlanForMembership(membership);
    const totalPrice = plan
      ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price)
      : parseDecimal(membership.pricePaid) * parseDuration(membership.duration);
    const currentPaid = parseDecimal(membership.pricePaid);
    const remaining = totalPrice - currentPaid;
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
      alert("Enter a valid payment amount");
      return;
    }

    const currentPaid = parseDecimal(selectedMembership.pricePaid);
    const newPaid = Number((currentPaid + amount).toFixed(2));
    const plan = findPlanForMembership(selectedMembership);
    const totalPrice = plan
      ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price)
      : currentPaid;
    const newStatus =
      plan && newPaid >= totalPrice
        ? "completed"
        : selectedMembership.status || "active";

    setUpdating(true);
    try {
      await api.put(`/memberships/${selectedMembership.id}`, {
        pricePaid: newPaid,
        paymentId: paymentReference || selectedMembership.paymentId,
        status: newStatus,
      });

      const res = await api.get("/memberships");
      setMemberships(Array.isArray(res.data) ? res.data : []);
      setSelectedMembership(null);
      setUpdateAmount("");
      setPaymentReference("");
      alert("EMI payment details updated");
    } catch (err) {
      console.error("Failed to update membership payment:", err);
      alert("Unable to save payment update");
    } finally {
      setUpdating(false);
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
          <div className="relative group">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="py-2.5 pl-4 pr-10 bg-transparent border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-orange-500/50 outline-none appearance-none cursor-pointer transition-all backdrop-blur-md hover:bg-white/5"
            >
              <option value="all" className="bg-neutral-900">All Status</option>
              <option value="active" className="bg-neutral-900">Active</option>
              <option value="completed" className="bg-neutral-900">Completed</option>
              <option value="expired" className="bg-neutral-900">Expired</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none group-hover:text-white transition-colors" />
          </div>

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
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/60">
          No records matching your criteria.
        </div>
      ) : (
        <>
          {viewMode === "table" ? (
            /* ================= TABLE VIEW ================= */
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm text-left text-gray-200 border-collapse">
                <thead className="sticky top-0 bg-white/5 backdrop-blur-xl border-b border-white/10 z-10 text-white/40 uppercase text-[10px] tracking-[0.2em] font-black">
                  <tr>
                    <th className="px-6 py-4 border-b border-white/5">S.No</th>
                    <th className="px-6 py-4 border-b border-white/5">Member</th>
                    <th className="px-6 py-4 border-b border-white/5">Plan</th>
                    <th className="px-6 py-4 border-b border-white/5">Duration</th>
                    <th className="px-6 py-4 border-b border-white/5">Initial Payment</th>
                    <th className="px-6 py-4 border-b border-white/5">Next Payment</th>
                    <th className="px-6 py-4 border-b border-white/5">Total Price</th>
                    <th className="px-6 py-4 border-b border-white/5">Payment Method</th>
                    <th className="px-6 py-4 border-b border-white/5">Created</th>
                    <th className="px-6 py-4 border-b border-white/5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEMIs.map((membership, idx) => {
                    const plan = findPlanForMembership(membership);
                    const duration = parseDuration(membership.duration) || 1;
                    const totalPrice = plan
                      ? parseDecimal(
                          plan.finalPrice ?? plan.final_price ?? plan.price,
                        )
                      : parseDecimal(membership.pricePaid) * duration;
                    const initialPayment = parseDecimal(membership.pricePaid);
                    const balanceDue = Number(
                      (totalPrice - initialPayment).toFixed(2),
                    );
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 30);
                    const paymentMethodLabel = membership.paymentId || "N/A";

                    return (
                      <tr
                        key={membership.id}
                        className="border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-white">
                          {(currentPage - 1) * itemsPerPage + idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">
                            {membership.userName ||
                              membership.username ||
                              "Unknown"}
                          </div>
                          <div className="text-[11px] text-white/50">
                            {membership.userEmail || membership.email || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold">{membership.planName}</div>
                          <div className="text-[11px] text-white/50">
                            {plan ? "Matched plan" : "Plan lookup not found"}
                          </div>
                        </td>
                        <td className="px-6 py-4">{duration} months</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-green-400">
                            ₹{initialPayment.toFixed(2)}
                          </div>
                          <div className="text-xs text-white/50">Paid today</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-blue-400">
                            ₹{balanceDue.toFixed(2)}
                          </div>
                          <div className="text-xs text-white/50">
                            Due{" "}
                            {dueDate.toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-orange-400">
                            ₹{totalPrice.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 capitalize">
                          {paymentMethodLabel}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(membership.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-3">
                            <button
                              onClick={() => viewDetails(membership)}
                              className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/20 text-blue-300 hover:bg-blue-500/40 transition"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>

                            <button
                              onClick={() => selectMembership(membership)}
                              className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/20 text-orange-300 hover:bg-orange-500/40 transition"
                              title="Update Payment"
                            >
                              <Edit size={18} />
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
                const totalPrice = plan
                  ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price)
                  : parseDecimal(membership.pricePaid) * duration;
                const initialPayment = parseDecimal(membership.pricePaid);
                const balanceDue = Number((totalPrice - initialPayment).toFixed(2));
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 30);

                return (
                  <div 
                    key={membership.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        membership.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'
                      }`}>
                        {membership.status || 'Active'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center text-orange-500 font-bold">
                        {(currentPage - 1) * itemsPerPage + idx + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-white line-clamp-1">{membership.userName || membership.username || "Unknown"}</h3>
                        <p className="text-xs text-white/40">{membership.userEmail || membership.email || "-"}</p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                        <div>
                          <p className="text-[10px] text-white/40 uppercase font-black tracking-wider">Plan Details</p>
                          <p className="text-sm font-semibold text-white">{membership.planName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-white/40 uppercase font-black tracking-wider">Duration</p>
                          <p className="text-sm font-semibold text-white">{duration} Months</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-500/5 p-3 rounded-xl border border-green-500/10 text-center">
                          <p className="text-[10px] text-green-500/60 uppercase font-black tracking-wider mb-1">Paid</p>
                          <p className="text-base font-bold text-green-400">₹{initialPayment.toFixed(2)}</p>
                        </div>
                        <div className="bg-blue-500/5 p-3 rounded-xl border border-blue-500/10 text-center">
                          <p className="text-[10px] text-blue-500/60 uppercase font-black tracking-wider mb-1">Due</p>
                          <p className="text-base font-bold text-blue-400">₹{balanceDue.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="text-center py-2">
                        <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Total Value</p>
                        <p className="text-xl font-black text-orange-500">₹{totalPrice.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => viewDetails(membership)}
                        className="flex-1 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Eye size={14} /> Details
                      </button>
                      <button
                        onClick={() => selectMembership(membership)}
                        className="flex-1 py-2.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Edit size={14} /> Update
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
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        currentPage === i + 1
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
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto
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
                          Already collected
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
                        const totalPrice = plan
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

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-3">
                  Payment Amount for Remaining Balance
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
                    placeholder="Enter payment amount"
                  />
                </div>
                <p className="text-xs text-white/50 mt-2">
                  Should match the remaining balance amount
                </p>
              </div>

              {/* Reference Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white mb-3">
                  Payment Reference (Optional)
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/20 focus:ring-2 focus:ring-orange-500 outline-none text-white placeholder-gray-600 hover:border-orange-500/50 transition-all"
                  placeholder="e.g., UPI Transaction ID, Cheque No."
                />
                <p className="text-xs text-white/50 mt-2">
                  For tracking and records
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
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
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto
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
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 30);
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
              </div>

              {/* Bottom Info */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Card title="Payment Mode" value={viewingDetails.paymentMode} />
                <Card title="Status" value={viewingDetails.status} />
              </div>

              <button
                onClick={() => setViewingDetails(null)}
                className="w-full border border-white/20 hover:border-white/40 py-3 rounded-xl font-semibold text-white transition-all hover:bg-white/5"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EMIList;
