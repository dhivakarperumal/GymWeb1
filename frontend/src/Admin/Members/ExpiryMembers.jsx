import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, Search, Calendar, Phone, Mail, 
  AlertCircle, Clock, ArrowRight, User, LayoutGrid, Table as TableIcon
} from "lucide-react";
import api from "../../api";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const ExpiryMembers = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("card");

  useEffect(() => {
    fetchExpiringMembers();
  }, []);

  const fetchExpiringMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/members");
      const data = Array.isArray(res.data) ? res.data : [];
      
      // Filter members whose plans are expiring in the next 5 days
      const today = dayjs();
      const next5Days = today.add(5, "day");
      
      const expiring = data.filter(m => {
        if (!m.expiry_date) return false;
        const expiryDate = dayjs(m.expiry_date);
        // Show if expiring between today and next 5 days
        return expiryDate.isAfter(today.subtract(1, 'day')) && expiryDate.isBefore(next5Days.add(1, 'day'));
      }).sort((a, b) => dayjs(a.expiry_date).diff(dayjs(b.expiry_date)));

      setMembers(expiring);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load expiring members");
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search) ||
      m.id?.toString().includes(search)
    );
  }, [members, search]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-white/40 text-xs uppercase tracking-[0.4em]">Analyzing Plan Expirations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <button onClick={() => navigate("/admin/settings")} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-2">
            <ChevronLeft size={20} />
            <span className="font-bold uppercase tracking-wider text-xs">Back to Settings</span>
          </button>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Clock className="text-orange-500" />
            Plan Expiry Details
          </h1>
          <p className="text-white/40 text-sm mt-1">Members with plans expiring in the next 5 days</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          {/* View Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5 p-1">
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
      </div>

      {filteredMembers.length === 0 ? (
        <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl py-20 text-center">
          <AlertCircle size={48} className="mx-auto text-white/10 mb-4" />
          <p className="text-white/40 font-bold uppercase tracking-widest text-sm">No members expiring soon</p>
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((m) => {
            const daysLeft = dayjs(m.expiry_date).diff(dayjs(), 'day');
            const isCritical = daysLeft <= 7;

            return (
              <div key={m.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/[0.07] transition-all group">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white group-hover:text-orange-500 transition-colors">{m.name}</h3>
                      <p className="text-white/30 text-[10px] uppercase font-black tracking-widest">ID: #{m.id}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isCritical ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-400'}`}>
                    {daysLeft} Days Left
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <Calendar size={16} className="text-orange-500" />
                    <span>Plan: <span className="text-white font-bold">{m.plan || 'N/A'}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <Clock size={16} className="text-orange-500" />
                    <span>Expires: <span className="text-white font-bold">{dayjs(m.expiry_date).format('DD MMM, YYYY')}</span></span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white/60">
                    <Phone size={16} className="text-orange-500" />
                    <span>{m.phone || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => navigate(`/admin/member-details/${m.id}`)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <User size={14} /> Profile
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/addmembers/${m.id}`)}
                    className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs uppercase hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                    Renew <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/10 text-white/60 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Plan Name</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Days Left</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {filteredMembers.map((m) => {
                const daysLeft = dayjs(m.expiry_date).diff(dayjs(), 'day');
                const isCritical = daysLeft <= 7;
                return (
                  <tr key={m.id} className="hover:bg-white/[0.03] transition-colors group">
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
                    <td className="px-6 py-4">{dayjs(m.expiry_date).format('DD MMM, YYYY')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${isCritical ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                        {daysLeft} Days
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => navigate(`/admin/member-details/${m.id}`)}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
                          title="View Profile"
                        >
                          <User size={14} />
                        </button>
                        <button 
                          onClick={() => navigate(`/admin/addmembers/${m.id}`)}
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
    </div>
  );
};

export default ExpiryMembers;
