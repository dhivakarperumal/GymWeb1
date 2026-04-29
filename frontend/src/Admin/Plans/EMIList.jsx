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

    // Auto-fill remaining balance amount for 30-day payment plan
    const plan = findPlanForMembership(membership);
    const totalPrice = plan
      ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price)
      : parseDecimal(membership.pricePaid) * parseDuration(membership.duration);
    const currentPaid = parseDecimal(membership.pricePaid);
    const remaining = totalPrice - currentPaid;
    const suggested = remaining > 0 ? remaining.toFixed(2) : '0.00';
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

  const Card = ({ title, value, color = "text-white" }) => (
  <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
    <p className="text-xs text-white/50">{title}</p>
    <p className={`font-bold ${color}`}>{value}</p>
  </div>
);

  return (
    <div className="min-h-screen p-6 text-white">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">EMI Payments</h1>
          <p className="text-white/60 mt-2 max-w-2xl">
            All active EMI memberships with 30-day payment plan. Initial amount paid today, remaining balance due in 30 days.
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
                <th className="px-6 py-4">Initial Payment</th>
                <th className="px-6 py-4">Balance Due (30 Days)</th>
                <th className="px-6 py-4">Total Amount</th>
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
                const initialPayment = parseDecimal(membership.pricePaid);
                const balanceDue = Number((totalPrice - initialPayment).toFixed(2));
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 30);
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
                    <td className="px-6 py-4">
                      <div className="font-semibold text-green-400">₹{initialPayment.toFixed(2)}</div>
                      <div className="text-xs text-white/50">Paid today</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-blue-400">₹{balanceDue.toFixed(2)}</div>
                      <div className="text-xs text-white/50">{dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-orange-400">₹{totalPrice.toFixed(2)}</div>
                    </td>
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
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        shadow-[0_30px_80px_rgba(0,0,0,0.6)] p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
            30-Day Payment Plan
          </h2>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-orange-500/30 transition-all">
            <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Plan</p>
            <p className="font-semibold text-white text-lg">{selectedMembership.planName}</p>
            <p className="text-sm text-white/60 mt-1">
              {selectedMembership.duration} months
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 p-4 rounded-xl border border-green-500/30">
            <p className="text-xs text-green-400 uppercase tracking-wide font-semibold mb-2">Already Paid</p>
            <p className="text-green-400 font-bold text-xl">
              ₹{parseDecimal(selectedMembership.pricePaid).toFixed(2)}
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-orange-500/30 transition-all">
            <p className="text-xs text-white/50 uppercase tracking-wide mb-2">Status</p>
            <p className="font-semibold text-white">
              {selectedMembership.status || "active"}
            </p>
          </div>
        </div>

        {/* Payment Plan Details */}
        <div className="bg-gradient-to-r from-blue-900/30 to-blue-900/10 p-6 rounded-2xl border border-blue-500/30 mb-6">
          <p className="text-blue-400 text-xs uppercase tracking-wide font-bold mb-4">📋 Payment Schedule</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500/20 border border-green-500">
                  <span className="text-xs font-bold text-green-400">✓</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Initial Payment (Today)</p>
                  <p className="text-xs text-white/60">Already collected</p>
                </div>
              </div>
              <p className="text-green-400 font-bold text-lg">₹{parseDecimal(selectedMembership.pricePaid).toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500/20 border border-blue-500">
                  <span className="text-xs font-bold text-blue-400">2</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Remaining Balance (Due in 30 Days)</p>
                  <p className="text-xs text-white/60">
                    Due by {(() => {
                      const dueDate = new Date();
                      dueDate.setDate(dueDate.getDate() + 30);
                      return dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    })()}
                  </p>
                </div>
              </div>
              <p className="text-blue-400 font-bold text-lg">
                ₹{(() => {
                  const plan = findPlanForMembership(selectedMembership);
                  const totalPrice = plan
                    ? parseDecimal(plan.finalPrice ?? plan.final_price ?? plan.price)
                    : parseDecimal(selectedMembership.pricePaid) * parseDuration(selectedMembership.duration);
                  return (totalPrice - parseDecimal(selectedMembership.pricePaid)).toFixed(2);
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white mb-3">Payment Amount for Remaining Balance</label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-white font-semibold text-lg">₹</span>
            <input
              type="number"
              value={updateAmount}
              onChange={(e) => setUpdateAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/20 focus:ring-2 focus:ring-orange-500 outline-none text-white placeholder-gray-600 hover:border-orange-500/50 transition-all"
              placeholder="Enter payment amount"
            />
          </div>
          <p className="text-xs text-white/50 mt-2">Should match the remaining balance amount</p>
        </div>

        {/* Reference Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white mb-3">Payment Reference (Optional)</label>
          <input
            type="text"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/5 border border-white/20 focus:ring-2 focus:ring-orange-500 outline-none text-white placeholder-gray-600 hover:border-orange-500/50 transition-all"
            placeholder="e.g., UPI Transaction ID, Cheque No."
          />
          <p className="text-xs text-white/50 mt-2">For tracking and records</p>
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
        bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        shadow-[0_30px_80px_rgba(0,0,0,0.6)] p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
            EMI Payment Details
          </h2>
        </div>

        {/* Top Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card title="Plan" value={viewingDetails.planName} />
          <Card
            title="Total Price"
            value={`₹${(() => {
              const plan = findPlanForMembership(viewingDetails);
              return plan
                ? parseDecimal(plan.finalPrice ?? plan.price)
                : parseDecimal(viewingDetails.pricePaid) *
                    parseDuration(viewingDetails.duration);
            })().toFixed(2)}`}
          />
          <Card
            title="Already Paid"
            value={`₹${parseDecimal(viewingDetails.pricePaid).toFixed(2)}`}
            color="text-green-400"
          />
          <Card
            title="Remaining Due"
            value={`₹${(() => {
              const plan = findPlanForMembership(viewingDetails);
              const total = plan
                ? parseDecimal(plan.finalPrice ?? plan.price)
                : parseDecimal(viewingDetails.pricePaid) *
                  parseDuration(viewingDetails.duration);
              return (total - parseDecimal(viewingDetails.pricePaid)).toFixed(2);
            })()}`}
            color="text-blue-400"
          />
        </div>

        {/* Payment Schedule */}
        <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 p-6 rounded-2xl border border-indigo-500/30 mb-6">
          <p className="text-indigo-400 text-xs uppercase tracking-wide font-bold mb-4">💳 30-Day Payment Plan</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500/20 border border-green-500">
                  <span className="text-xs font-bold text-green-400">✓</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Step 1: Initial Payment</p>
                  <p className="text-xs text-white/60">Already paid</p>
                </div>
              </div>
              <p className="text-green-400 font-bold text-lg">₹{parseDecimal(viewingDetails.pricePaid).toFixed(2)}</p>
            </div>
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500/20 border border-blue-500">
                  <span className="text-xs font-bold text-blue-400">2</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Step 2: Remaining Payment</p>
                  <p className="text-xs text-white/60">
                    Due by {(() => {
                      const dueDate = new Date();
                      dueDate.setDate(dueDate.getDate() + 30);
                      return dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    })()}
                  </p>
                </div>
              </div>
              <p className="text-blue-400 font-bold text-lg">
                ₹{(() => {
                  const plan = findPlanForMembership(viewingDetails);
                  const total = plan
                    ? parseDecimal(plan.finalPrice ?? plan.price)
                    : parseDecimal(viewingDetails.pricePaid) *
                      parseDuration(viewingDetails.duration);
                  return (total - parseDecimal(viewingDetails.pricePaid)).toFixed(2);
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
