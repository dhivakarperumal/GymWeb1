import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ChevronLeft, Search, Calendar, Phone, Mail, 
  AlertCircle, Clock, ArrowRight, User, LayoutGrid, Table as TableIcon
} from "lucide-react";
import api from "../../api";
import { useAuth } from "../../PrivateRouter/AuthContext";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const ExpiryMembers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768 ? "table" : "card";
    }
    return "table";
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isTrainer = location.pathname.startsWith("/trainer");
  const basePath = isTrainer ? "/trainer" : "/admin";

  useEffect(() => {
    fetchExpiringMembers();
  }, [user?.id]);

  const fetchExpiringMembers = async () => {
    try {
      setLoading(true);
      const url = isTrainer && user?.id ? `/members?trainerUserId=${user.id}` : "/members";
      const res = await api.get(url);
      const data = Array.isArray(res.data) ? res.data : [];
      
      // Show assigned members whose plans are already expired or expiring in the next 5 days
      const today = dayjs();
      const next5Days = today.add(5, "day");

      const expiring = data.filter((m) => {
        const expiryValue = m.expiry_date || m.endDate || m.end_date || m.expiryDate || m.pt_expiry_date;
        if (!expiryValue) return false;

        const expiryDate = dayjs(expiryValue);
        if (!expiryDate.isValid()) return false;

        const expiredOrSoon =
          expiryDate.isBefore(today, "day") ||
          (expiryDate.isAfter(today.subtract(1, "day")) && expiryDate.isBefore(next5Days.add(1, "day")));

        return expiredOrSoon;
      }).sort((a, b) => {
        const aDate = dayjs(a.expiry_date || a.endDate || a.end_date || a.expiryDate || a.pt_expiry_date);
        const bDate = dayjs(b.expiry_date || b.endDate || b.end_date || b.expiryDate || b.pt_expiry_date);
        return aDate.diff(bDate);
      });

      setMembers(expiring);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load expiring members");
    } finally {
      setLoading(false);
    }
  };

  const getExpiryStatus = (member) => {
    const expiryValue = member.expiry_date || member.endDate || member.end_date || member.expiryDate || member.pt_expiry_date;
    if (!expiryValue) return "all";

    const expiryDate = dayjs(expiryValue);
    if (!expiryDate.isValid()) return "all";

    const today = dayjs();
    if (expiryDate.isSame(today, "day")) return "today";
    if (expiryDate.isBefore(today, "day")) return "expired";
    return "soon";
  };

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.phone?.includes(search) ||
        m.id?.toString().includes(search);

      const matchesFilter = expiryFilter === "all" || getExpiryStatus(m) === expiryFilter;
      return matchesSearch && matchesFilter;
    });
  }, [members, search, expiryFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, expiryFilter]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768 && viewMode !== "table") {
        setViewMode("table");
      }
      if (window.innerWidth < 768 && viewMode !== "card") {
        setViewMode("card");
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [viewMode]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / itemsPerPage));
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const expirySummary = useMemo(() => {
    const today = dayjs();
    const todayCount = members.filter((m) => {
      const expiryValue = m.expiry_date || m.endDate || m.end_date || m.expiryDate || m.pt_expiry_date;
      if (!expiryValue) return false;
      const expiryDate = dayjs(expiryValue);
      return expiryDate.isValid() && expiryDate.isSame(today, "day");
    }).length;

    return {
      total: members.length,
      today: todayCount,
    };
  }, [members]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-white/40 text-xs uppercase tracking-[0.4em]">Analyzing Plan Expirations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-3 pb-12 text-white sm:px-0">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              type="text"
              placeholder="Search member name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end md:w-auto">
          <div className="relative w-full sm:w-auto">
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              className="w-full appearance-none bg-white/5 border border-white/10 rounded-2xl px-4 py-3 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 sm:w-auto"
            >
              <option value="all" className="bg-slate-900">All</option>
              <option value="today" className="bg-slate-900">Today</option>
              <option value="expired" className="bg-slate-900">Expired</option>
              <option value="soon" className="bg-slate-900">Soon</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/50">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5 p-1 self-end sm:self-auto">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              title="Card View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-orange-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              title="Table View"
            >
              <TableIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-yellow-500/15 to-orange-500/10 p-4 shadow-lg shadow-orange-500/10 sm:p-5">
          <div className="flex items-center justify-between text-white/70 text-sm">
            <span>Total Expiry</span>
            <Clock size={18} className="text-orange-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">{expirySummary.total}</div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-red-500/15 to-rose-500/10 p-4 shadow-lg shadow-red-500/10 sm:p-5">
          <div className="flex items-center justify-between text-white/70 text-sm">
            <span>Today Expiry</span>
            <AlertCircle size={18} className="text-red-400" />
          </div>
          <div className="mt-3 text-3xl font-bold text-white">{expirySummary.today}</div>
        </div>
      </div>

      {filteredMembers.length === 0 ? (
        <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl py-20 text-center">
          <AlertCircle size={48} className="mx-auto text-white/10 mb-4" />
          <p className="text-white/40 font-bold uppercase tracking-widest text-sm">No members expiring soon</p>
        </div>
      ) : viewMode === "card" ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedMembers.map((m) => {
            const expiryValue = m.expiry_date || m.endDate || m.end_date || m.expiryDate || m.pt_expiry_date;
            const daysLeft = expiryValue ? dayjs(expiryValue).startOf('day').diff(dayjs().startOf('day'), 'day') : 0;
            const isCritical = daysLeft <= 7;

            return (
              <div key={m.id} className="bg-white/5 border border-white/10 rounded-3xl p-4 hover:bg-white/[0.07] transition-all group sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 text-sm font-bold text-white shadow-lg sm:h-12 sm:w-12 sm:text-xl">
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-white group-hover:text-orange-500 transition-colors sm:text-base">{m.name}</h3>
                      <p className="text-white/30 text-[9px] uppercase font-black tracking-widest sm:text-[10px]">ID: #{m.id}</p>
                    </div>
                  </div>
                  <div className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase sm:px-3 sm:text-[10px] ${isCritical && daysLeft > 0 ? 'bg-red-500/20 text-red-500' : daysLeft <= 0 ? 'bg-gray-500/20 text-gray-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    {daysLeft > 0 ? `${daysLeft} Days Left` : 'Expired'}
                  </div>
                </div>

                <div className="mb-5 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-white/60 sm:text-sm">
                    <Calendar size={16} className="text-orange-500" />
                    <span>Plan: <span className="text-white font-bold">{m.plan || 'N/A'}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/60 sm:text-sm">
                    <Clock size={16} className="text-orange-500" />
                    <span>Expires: <span className="text-white font-bold">{expiryValue ? dayjs(expiryValue).format('DD MMM, YYYY') : 'N/A'}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/60 sm:text-sm">
                    <Phone size={16} className="text-orange-500" />
                    <span>{m.phone || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-white/5 pt-4 sm:flex-row">
                  <button 
                    onClick={() => navigate(`${basePath}/member_details/${m.id}`)}
                    className="flex-1 rounded-xl bg-white/5 border border-white/10 py-2.5 text-white font-bold text-[10px] uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2 sm:text-xs"
                  >
                    <User size={14} /> Profile
                  </button>
                  <button 
                    onClick={() => navigate(`${basePath}/buyplanadmin`, { state: { member: m } })}
                    className="flex-1 rounded-xl bg-orange-500 py-2.5 text-white font-bold text-[10px] uppercase hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 sm:text-xs"
                  >
                    Renew <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        </>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/10 text-white/60 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">S.No</th>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Plan Name</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Days Left</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {paginatedMembers.map((m, idx) => {
                const sNo = (currentPage - 1) * itemsPerPage + idx + 1;
                const expiryValue = m.expiry_date || m.endDate || m.end_date || m.expiryDate || m.pt_expiry_date;
                const daysLeft = expiryValue ? dayjs(expiryValue).startOf('day').diff(dayjs().startOf('day'), 'day') : 0;
                const isCritical = daysLeft <= 7;
                return (
                  <tr key={m.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-4 text-white/50 font-medium">{sNo}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold">
                          {m.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{m.name}</p>
                          <p className="text-[10px] text-white/30 uppercase">ID: #{m.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{m.plan || 'N/A'}</td>
                    <td className="px-6 py-4">{expiryValue ? dayjs(expiryValue).format('DD MMM, YYYY') : 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${isCritical && daysLeft > 0 ? 'bg-red-500/20 text-red-500' : daysLeft <= 0 ? 'bg-gray-500/20 text-gray-400' : 'bg-orange-500/20 text-orange-500'}`}>
                        {daysLeft > 0 ? `${daysLeft} Days` : 'Expired'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => navigate(`${basePath}/member_details/${m.id}`)}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                          title="View Profile"
                        >
                          <User size={14} />
                        </button>
                        <button 
                          onClick={() => navigate(`${basePath}/buyplanadmin`, { state: { member: m } })}
                          className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                          title="Renew Membership"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredMembers.length > 0 && (
        <div className="flex items-center gap-2 justify-center mt-6 pb-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            Prev
          </button>
          <span className="text-sm font-medium text-white/60 px-4">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpiryMembers;
