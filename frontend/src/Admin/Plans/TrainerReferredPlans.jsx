import React, { useEffect, useState, useMemo } from "react";
import api from "../../api";
import {
  Users,
  Search,
  RefreshCcw,
  UserCheck,
  CalendarDays,
  IndianRupee,
  BadgeCheck,
  Phone,
  Mail,
  X,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Trainer-Referred Plans Page
   Shows all ACTIVE memberships that have a
   non-empty referredBy field (trainer referred).
───────────────────────────────────────────── */

const fmt = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const badge = (label, color) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${color}`}
  >
    {label}
  </span>
);

export default function TrainerReferredPlans() {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/memberships");
      const all = Array.isArray(res.data) ? res.data : res.data?.memberships || [];
      // Only active memberships with a referredBy value
      const filtered = all.filter(
        (m) =>
          m.status === "active" &&
          m.referredBy &&
          m.referredBy.toString().trim() !== ""
      );
      setMemberships(filtered);
    } catch (err) {
      console.error("Failed to fetch memberships:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return memberships;
    return memberships.filter(
      (m) =>
        (m.userName || "").toLowerCase().includes(q) ||
        (m.userPhone || "").includes(q) ||
        (m.userEmail || "").toLowerCase().includes(q) ||
        (m.planName || "").toLowerCase().includes(q) ||
        (m.referredBy || "").toLowerCase().includes(q)
    );
  }, [memberships, search]);

  return (
    <div className="text-white min-h-screen">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
            Trainer Referred Plans
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Active memberships approved via trainer referral
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* SEARCH */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-white/10 border border-white/10 rounded-xl focus-within:ring-2 focus-within:ring-orange-500 w-56">
            <Search size={16} className="text-white/40 shrink-0" />
            <input
              type="text"
              placeholder="Search member / trainer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-white text-sm placeholder-white/30 outline-none w-full"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={14} className="text-white/40 hover:text-white" />
              </button>
            )}
          </div>

          {/* REFRESH */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            icon: <Users size={20} className="text-orange-400" />,
            label: "Total Referred",
            value: memberships.length,
          },
          {
            icon: <BadgeCheck size={20} className="text-green-400" />,
            label: "Active Plans",
            value: memberships.filter((m) => m.status === "active").length,
          },
          {
            icon: <IndianRupee size={20} className="text-amber-400" />,
            label: "Total Revenue",
            value: `₹${memberships
              .reduce((sum, m) => sum + parseFloat(m.pricePaid || 0), 0)
              .toLocaleString("en-IN")}`,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              {s.icon}
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest">{s.label}</p>
              <p className="text-xl font-bold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABLE ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <p className="text-white/30 text-xs uppercase tracking-widest">Loading...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <UserCheck size={48} className="text-white/10" />
          <p className="text-white/30 text-sm">
            {search ? "No results match your search." : "No trainer-referred active memberships found."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-white/5 text-white/40 text-[11px] uppercase tracking-wider">
                <th className="px-5 py-4">#</th>
                <th className="px-5 py-4">Member</th>
                <th className="px-5 py-4">Contact</th>
                <th className="px-5 py-4">Plan</th>
                <th className="px-5 py-4">Dates</th>
                <th className="px-5 py-4">Paid</th>
                <th className="px-5 py-4">Payment</th>
                <th className="px-5 py-4">Referred By</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((m, idx) => {
                const daysLeft = m.endDate
                  ? Math.ceil((new Date(m.endDate) - new Date()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <tr
                    key={m.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    {/* # */}
                    <td className="px-5 py-4 text-white/30 font-mono text-xs">{idx + 1}</td>

                    {/* MEMBER */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {(m.userName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                            {m.userName || "—"}
                          </p>
                          <p className="text-[10px] text-white/30">ID #{m.userId}</p>
                        </div>
                      </div>
                    </td>

                    {/* CONTACT */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        {m.userPhone && (
                          <span className="flex items-center gap-1 text-white/60 text-xs">
                            <Phone size={11} /> {m.userPhone}
                          </span>
                        )}
                        {m.userEmail && (
                          <span className="flex items-center gap-1 text-white/60 text-xs">
                            <Mail size={11} /> {m.userEmail}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* PLAN */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{m.planName || "—"}</p>
                      <p className="text-[10px] text-white/30">{m.duration} months</p>
                    </td>

                    {/* DATES */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1 text-xs text-white/60">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={11} className="text-green-400" />
                          Start: {fmt(m.startDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays size={11} className="text-red-400" />
                          End: {fmt(m.endDate)}
                        </span>
                        {daysLeft !== null && (
                          <span
                            className={`text-[10px] font-bold ${
                              daysLeft <= 7
                                ? "text-red-400"
                                : daysLeft <= 30
                                ? "text-amber-400"
                                : "text-green-400"
                            }`}
                          >
                            {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* PAID */}
                    <td className="px-5 py-4">
                      <p className="text-white font-bold">₹{parseFloat(m.pricePaid || 0).toLocaleString("en-IN")}</p>
                      {m.price && parseFloat(m.price) !== parseFloat(m.pricePaid) && (
                        <p className="text-[10px] text-white/30 line-through">
                          ₹{parseFloat(m.price).toLocaleString("en-IN")}
                        </p>
                      )}
                    </td>

                    {/* PAYMENT STATUS */}
                    <td className="px-5 py-4">
                      {m.paymentStatus === "Paid"
                        ? badge("Paid", "bg-green-500/20 text-green-400")
                        : m.paymentStatus === "Partial"
                        ? badge("Partial", "bg-amber-500/20 text-amber-400")
                        : badge("Pending", "bg-red-500/20 text-red-400")}
                      {m.paymentMode && (
                        <p className="text-[10px] text-white/30 mt-1 capitalize">{m.paymentMode}</p>
                      )}
                    </td>

                    {/* REFERRED BY */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-[10px] font-bold shrink-0">
                          {(m.referredBy || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-orange-300 font-semibold text-xs">
                          {m.referredBy}
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      {badge("Active", "bg-green-500/20 text-green-400")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
