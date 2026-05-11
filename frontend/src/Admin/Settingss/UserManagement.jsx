import { useEffect, useState } from "react";
import api from "../../api";
import toast from "react-hot-toast";
import { FaUsers, FaUserPlus, FaSearch, FaArrowLeft, FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../PrivateRouter/AuthContext";

/* ================= GLASS CLASSES ================= */
const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]";

const glassInput =
  "bg-gray-800 border border-white/20 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // pagination
  const { role: myRole } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 10; // items per page
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      const data = Array.isArray(res.data) ? res.data : [];
      setUsers(
        data.map((u) => ({
          id: u.id,
          username: u.username || u.email || "Unknown",
          email: u.email,
          mobile: u.mobile,
          active: u.status === "active" || u.status === undefined || u.active === 1 || u.active === true,
          role: (u.role || "member").toLowerCase(),
        }))
      );
    } catch (err) {
      console.error("Failed to load users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id, role) => {
    try {
      await api.put(`/users/${id}`, { role });
      toast.success("Role updated");
      loadUsers();
    } catch (err) {
      console.error("Failed to update role:", err);
      toast.error("Failed to update role");
    }
  };

  const toggleStatus = async (id, currentActive) => {
    try {
      await api.put(`/users/${id}`, { active: !currentActive });
      toast.success("User status updated");
      loadUsers();
    } catch (err) {
      console.error("Failed to toggle status:", err);
      toast.error("Failed to toggle status");
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.active).length;

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.active) ||
      (statusFilter === "inactive" && !u.active);

    return matchSearch && matchRole && matchStatus;
  });

  // reset page when filters/search change
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const pagedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);


  if (loading) {
    return <p className="text-center mt-10 text-gray-300">Loading users…</p>;
  }

  return (
    <div className="space-y-8 text-white">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          onClick={() => navigate("/admin/settings")}
          className="flex items-center gap-2 px-4 py-2 w-fit rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition"
        >
          <FaArrowLeft /> Back
        </button>

        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Your Role</span>
            <span className="text-orange-400 font-semibold text-sm capitalize">{myRole}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 border border-orange-500/20">
            <FaUsers />
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className={`${glassCard} p-6 flex justify-between items-center`}>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-300">
              Total Users
            </p>
            <h2 className="text-3xl font-bold">{totalUsers}</h2>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/30 text-blue-200 text-xl">
            <FaUsers />
          </div>
        </div>

        <div className={`${glassCard} p-6 flex justify-between items-center`}>
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-300">
              Active Users
            </p>
            <h2 className="text-3xl font-bold">{activeUsers}</h2>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/30 text-emerald-200 text-xl">
            <FaUserPlus />
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className={`${glassCard} p-5 flex flex-col lg:flex-row gap-4 justify-between`}>
        <div className="relative w-full lg:w-1/3">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email"
            className={`pl-10 w-full ${glassInput}`}
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={glassInput}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="trainer">Trainer</option>
            <option value="staff">Staff</option>
            <option value="member">Member</option>
            <option value="user">User</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={glassInput}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Disabled</option>
          </select>


        </div>
      </div>

      {/* TABLE */}
      <div className={`${glassCard} overflow-hidden`}>
        <table className="min-w-full text-sm text-gray-200">
          <thead className="bg-white/20">
            <tr>
              <th className="px-4 py-4 text-left">S No</th>
              <th className="px-4 py-4 text-left">Name</th>
              <th className="px-4 py-4 text-left">Email</th>
              <th className="px-4 py-4 text-left">Phone</th>
              <th className="px-4 py-4 text-left">Role</th>
              <th className="px-4 py-4 text-left">Status</th>
              <th className="px-4 py-4 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {pagedUsers.map((u, index) => (
              <tr key={u.id} className="border-b border-white/10 hover:bg-white/5 transition">
                <td className="px-4 py-3">{(page - 1) * pageSize + index + 1}</td>
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.mobile || "N/A"}</td>

                <td className="px-4 py-3">
                  {editingId === u.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={u.role}
                        onChange={(e) => {
                          updateRole(u.id, e.target.value);
                          setEditingId(null);
                        }}
                        className="bg-gray-800 border border-blue-500 rounded-lg px-2 py-1 text-white text-xs outline-none"
                        autoFocus
                        onBlur={() => setTimeout(() => setEditingId(null), 200)}
                      >
                        <option value="admin">Admin</option>
                        <option value="trainer">Trainer</option>
                        <option value="staff">Staff</option>
                        <option value="member">Member</option>
                        <option value="user">User</option>
                      </select>
                      <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300">
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                        ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                          u.role === 'trainer' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                            u.role === 'staff' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' :
                              'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                        {u.role}
                      </span>
                      <button
                        onClick={() => setEditingId(u.id)}
                        className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                        title="Change Role"
                      >
                        <FaEdit size={12} />
                      </button>
                    </div>
                  )}
                </td>

                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold
                    ${u.active
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-300"}`}>
                    {u.active ? "Active" : "Disabled"}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(u.id, u.active)}
                    className="px-3 py-1 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 transition text-xs"
                  >
                    Toggle
                  </button>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 mt-4">
          {/* Page info */}
          <p className="text-xs text-gray-400">
            Page <span className="text-white font-semibold">{page}</span> of{" "}
            <span className="text-white font-semibold">{totalPages}</span>
            &nbsp;&mdash;&nbsp;
            <span className="text-white font-semibold">{filteredUsers.length}</span> users
          </p>

          {/* Buttons row */}
          <div className="flex flex-wrap justify-center items-center gap-1.5 text-white">
            {/* Prev */}
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-sm font-medium transition"
            >
              ← Prev
            </button>

            {/* Smart page buttons */}
            {(() => {
              const delta = 2; // neighbours on each side
              const range = [];
              const pages = [];
              let last = 0;

              // build the set of page numbers to show
              for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
                range.push(i);
              }

              // always include first & last
              const allPages = [1, ...range, totalPages].filter(
                (v, i, a) => a.indexOf(v) === i // dedupe
              );

              allPages.forEach((p) => {
                if (last && p - last > 1) {
                  pages.push("ellipsis-" + last); // gap
                }
                pages.push(p);
                last = p;
              });

              return pages.map((item) =>
                typeof item === "string" ? (
                  <span
                    key={item}
                    className="px-2 py-1 text-gray-400 text-sm select-none"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition
                      ${page === item
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105"
                        : "bg-white/10 hover:bg-white/20 text-gray-300"
                      }`}
                  >
                    {item}
                  </button>
                )
              );
            })()}

            {/* Next */}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-sm font-medium transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;

