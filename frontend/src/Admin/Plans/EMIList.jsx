import React, { useEffect, useState } from "react";
import { Eye, Edit } from "lucide-react";
import api from "../../api";

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
  const [memberships, setMemberships] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [updateAmount, setUpdateAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [updating, setUpdating] = useState(false);
  const [viewingDetails, setViewingDetails] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membershipsRes, plansRes] = await Promise.all([
          api.get("/memberships"),
          api.get("/plans"),
        ]);

        setMemberships(Array.isArray(membershipsRes.data) ? membershipsRes.data : []);
        setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
      } catch (err) {
        console.error("Failed to load EMI records", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const emiMemberships = memberships.filter((m) => m.paymentMode === "emi");

  const findPlanForMembership = (membership) => {
    return plans.find(
      (plan) =>
        normalizeText(plan.name) === normalizeText(membership.planName) &&
        parseDuration(plan.duration) === Number(membership.duration)
    );
  };

  const selectMembership = (membership) => {
    setSelectedMembership(membership);
    setUpdateAmount("");
    setPaymentReference("");

    // Auto-fill next EMI amount
    const plan = findPlanForMembership(membership);
    const totalPrice = plan
      ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price)
      : parseDecimal(membership.pricePaid) * parseDuration(membership.duration);
    const currentPaid = parseDecimal(membership.pricePaid);
    const remaining = totalPrice - currentPaid;
    const durationMonths = parseDuration(membership.duration);
    const emiAmount = durationMonths > 1 ? remaining / (durationMonths - 1) : remaining;
    const suggested = remaining > 0 ? emiAmount.toFixed(2) : '0.00';
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
    const newStatus = plan && newPaid >= totalPrice ? "completed" : selectedMembership.status || "active";

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

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">EMI Payments</h1>
          <p className="text-white/60 mt-2 max-w-2xl">
            All active EMI memberships are listed here with installments, first payment, and balance amounts.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm text-white/70">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">EMI Records</p>
            <p className="mt-2 text-2xl font-semibold text-orange-400">{emiMemberships.length}</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Loaded Plans</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-400">{plans.length}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : emiMemberships.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/60">
          No EMI records found yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl p-6">
          <table className="min-w-full text-sm text-left text-white/90">
            <thead>
              <tr className="border-b border-white/20 text-xs uppercase tracking-[0.2em] text-white/70 bg-white/5">
                <th className="px-6 py-4 rounded-tl-2xl">Member</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">First Installment</th>
                <th className="px-6 py-4">EMI / Month</th>
                <th className="px-6 py-4">Remaining</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 rounded-tr-2xl">Actions</th>
              </tr>
            </thead>
            <tbody>
              {emiMemberships.map((membership) => {
                const plan = findPlanForMembership(membership);
                const duration = parseDuration(membership.duration) || 1;
                const totalPrice = plan
                  ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price)
                  : parseDecimal(membership.pricePaid) * duration;
                const firstInstallment = parseDecimal(membership.pricePaid);
                const remainingBalance = Number((totalPrice - firstInstallment).toFixed(2));
                const monthlyEMI = duration > 1 ? Number((remainingBalance / (duration - 1)).toFixed(2)) : remainingBalance;
                const paymentMethodLabel = membership.paymentId || "N/A";

                return (
                  <tr key={membership.id} className="border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{membership.userName || membership.username || "Unknown"}</div>
                      <div className="text-[11px] text-white/50">{membership.userEmail || membership.email || "-"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">{membership.planName}</div>
                      <div className="text-[11px] text-white/50">{plan ? "Matched plan" : "Plan lookup not found"}</div>
                    </td>
                    <td className="px-6 py-4">{duration} months</td>
                    <td className="px-6 py-4">₹{firstInstallment.toFixed(2)}</td>
                    <td className="px-6 py-4">₹{monthlyEMI.toFixed(2)}</td>
                    <td className="px-6 py-4">₹{remainingBalance.toFixed(2)}</td>
                    <td className="px-6 py-4 capitalize">{paymentMethodLabel}</td>
                    <td className="px-6 py-4">{new Date(membership.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => viewDetails(membership)}
                        className="rounded-full bg-blue-500/20 border border-blue-500 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/30 transition-colors flex items-center gap-2"
                      >
                        <Eye size={16} />
                        View Details
                      </button>
                      <button
                        onClick={() => selectMembership(membership)}
                        className="rounded-full bg-orange-500/20 border border-orange-500 px-4 py-2 text-sm text-orange-300 hover:bg-orange-500/30 transition-colors flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Update Payment
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedMembership && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setSelectedMembership(null)} />
          <div className="relative z-50 mt-8 rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">Update EMI Payment</h2>
            <p className="text-white/70 mb-6 text-lg">
              Recording next installment for <strong className="text-white">{selectedMembership.userName || selectedMembership.username}</strong>.
            </p>
            <div className="grid gap-6 md:grid-cols-3 mb-6">
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-6 border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-widest">Plan</p>
                <p className="mt-3 font-bold text-xl text-white">{selectedMembership.planName}</p>
                <p className="text-sm text-white/60">{selectedMembership.duration} months</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-6 border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-widest">Current Paid</p>
                <p className="mt-3 font-bold text-xl text-green-400">₹{parseDecimal(selectedMembership.pricePaid).toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-6 border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-widest">Current Status</p>
                <p className="mt-3 font-bold text-xl text-white">{selectedMembership.status || "active"}</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <label className="block">
                <span className="text-sm text-gray-300 font-medium mb-2 block">Next installment amount</span>
                <input
                  type="number"
                  value={updateAmount}
                  onChange={(e) => setUpdateAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white border border-white/20 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  placeholder="Enter amount collected now"
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-300 font-medium mb-2 block">Payment reference</span>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white border border-white/20 outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  placeholder="Transaction note or receipt ID"
                />
              </label>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                onClick={handleUpdatePayment}
                disabled={updating}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 px-8 py-4 text-lg font-semibold text-white hover:from-orange-600 hover:to-pink-600 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-lg"
              >
                {updating ? "Saving..." : "Save Next Payment"}
              </button>
              <button
                onClick={() => setSelectedMembership(null)}
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-transparent px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {viewingDetails && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setViewingDetails(null)} />
          <div className="relative z-50 mt-8 rounded-3xl border border-white/20 bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">EMI Payment Details</h2>
            <p className="text-white/70 mb-6 text-lg">
              Detailed breakdown for <strong className="text-white">{viewingDetails.userName || viewingDetails.username}</strong>.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-6 border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-widest">Plan</p>
                <p className="mt-3 font-bold text-xl text-white">{viewingDetails.planName}</p>
                <p className="text-sm text-white/60">{viewingDetails.duration} months</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-6 border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-widest">Total Plan Price</p>
                <p className="mt-3 font-bold text-xl text-white">₹{(() => {
                  const plan = findPlanForMembership(viewingDetails);
                  return plan ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price) : parseDecimal(viewingDetails.pricePaid) * parseDuration(viewingDetails.duration);
                })().toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-6 border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-widest">First Due Amount</p>
                <p className="mt-3 font-bold text-xl text-green-400">₹{parseDecimal(viewingDetails.pricePaid).toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-6 border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-widest">Second Due Amount</p>
                <p className="mt-3 font-bold text-xl text-orange-400">₹{(() => {
                  const plan = findPlanForMembership(viewingDetails);
                  const total = plan ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price) : parseDecimal(viewingDetails.pricePaid) * parseDuration(viewingDetails.duration);
                  const remaining = total - parseDecimal(viewingDetails.pricePaid);
                  const durationMonths = parseDuration(viewingDetails.duration);
                  return durationMonths > 1 ? (remaining / (durationMonths - 1)).toFixed(2) : remaining.toFixed(2);
                })()}</p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-6 border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-widest">Total Paid</p>
                <p className="mt-3 font-bold text-xl text-green-400">₹{parseDecimal(viewingDetails.pricePaid).toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-6 border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-widest">Remaining Balance</p>
                <p className="mt-3 font-bold text-xl text-red-400">₹{(() => {
                  const plan = findPlanForMembership(viewingDetails);
                  const total = plan ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price) : parseDecimal(viewingDetails.pricePaid) * parseDuration(viewingDetails.duration);
                  return (total - parseDecimal(viewingDetails.pricePaid)).toFixed(2);
                })()}</p>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 mb-6">
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-6 border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-widest">Payment Mode</p>
                <p className="mt-3 font-bold text-xl text-white">{viewingDetails.paymentMode || "N/A"}</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 p-6 border border-white/10">
                <p className="text-xs uppercase text-white/50 tracking-widest">Status</p>
                <p className="mt-3 font-bold text-xl text-white">{viewingDetails.status || "active"}</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                onClick={() => setViewingDetails(null)}
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-transparent px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-all"
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
