import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaCheckCircle,
  FaList,
  FaThLarge,
} from "react-icons/fa";
import api from "../../api"; 
import cache from "../../cache";

/* ---------------- UI ---------------- */
const glassCard =
  "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl";

const glassInput =
  "w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:ring-2 focus:ring-orange-500 outline-none";

/* ================= COMPONENT ================= */
const FacilitiesAll = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // "card" or "table"

  /* ================= LOAD ================= */
  const loadFacilities = async () => {
    if (cache.adminFacilities) {
      setFacilities(cache.adminFacilities);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await api.get("/facilities");
      const mappedData = data.map((f) => ({
        // ensure we always have an active flag
        active: f.active === false ? false : true,
        ...f,
      }));
      setFacilities(mappedData);
      cache.adminFacilities = mappedData;
    } catch (err) {
      console.error(err);
      if (!cache.adminFacilities) toast.error("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  /* ================= ACTIONS ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this facility?")) return;
    await api.delete(`/facilities/${id}`);
    toast.success("Facility deleted");
    loadFacilities();
  };

  const toggleStatus = async (id) => {
    // backend has a dedicated endpoint to flip the flag
    await api.patch(`/facilities/${id}/active`);
    toast.success("Status updated");
    loadFacilities();
  };

  /* ================= FILTER ================= */
  const filtered = facilities.filter(
    (f) =>
      f.title?.toLowerCase().includes(search.toLowerCase()) ||
      f.shortDesc?.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= UI ================= */
  return (
    <div className="min-h-screen p-0 space-y-6">

      {/* HEADER & CONTROLS */}
      <div className={`${glassCard} p-4 flex flex-col md:flex-row justify-between items-center gap-4`}>
        
        {/* LEFT -- SEARCH */}
        <div className="relative w-full md:w-1/3">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            placeholder="Search facilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${glassInput} pl-11`}
          />
        </div>

        {/* RIGHT -- BUTTONS & TOGGLE */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          
          <button
            onClick={() => navigate("/admin/addfecilities")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 
            px-6 py-3 rounded-xl text-white font-semibold
            bg-gradient-to-r from-orange-500 to-orange-600 
            hover:scale-105 transition shadow-md"
          >
            <FaPlus />
            Add Facility
          </button>

          {/* VIEW TOGGLE */}
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/20">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === "card"
                  ? "bg-orange-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              title="Card View"
            >
              <FaThLarge size={18} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-orange-500 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              title="Table View"
            >
              <FaList size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* LIST */}
      <div className="p-0 flex flex-col gap-6">

        {loading && !cache.adminFacilities ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 gap-6 bg-white/5 rounded-3xl border border-white/10 mt-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full animate-pulse" />
            </div>
            <p className="text-white/40 text-xs uppercase tracking-[0.4em] animate-pulse">Syncing Infrastructure</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="col-span-full text-center text-white/50 py-20 font-medium uppercase tracking-widest text-xs">No facilities found</p>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 w-full">
            {filtered.map((f) => (
            <div
              key={f.id}
              className={`${glassCard} p-6 flex flex-col md:flex-row gap-6 justify-between`}
            >
              {/* LEFT */}
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  {f.title}
                </h3>

                <p className="text-white/60 text-sm">
                  {f.shortDesc}
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  {f.equipments?.slice(0, 3).map((e, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex items-center gap-3">
                <FaCheckCircle
                  onClick={() => toggleStatus(f.id, f.active)}
                  className={`cursor-pointer text-2xl transition ${f.active
                      ? "text-emerald-400 hover:scale-110"
                      : "text-gray-500 hover:scale-110"
                    }`}
                  title={f.active ? "Active" : "Inactive"}
                />

                <button
                  onClick={() => navigate(`/admin/addfecilities/${f.id}`)}
                  className="p-3 rounded-xl bg-yellow-500/80 hover:bg-yellow-500 text-white"
                >
                  <FaEdit />
                </button>

                <button
                  onClick={() => handleDelete(f.id)}
                  className="p-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl overflow-hidden overflow-x-auto w-full">
            <table className="w-full min-w-[700px] text-sm text-gray-200 border-collapse">
              <thead className="bg-white/10 text-white">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold whitespace-nowrap">S No</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Title</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Description</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Equipments</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, index) => (
                  <tr key={f.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-4 py-4 text-base font-medium text-gray-400">{index + 1}</td>
                    <td className="px-4 py-4 text-base font-medium text-white">{f.title}</td>
                    <td className="px-4 py-4 text-base font-medium text-gray-400 truncate max-w-xs">{f.shortDesc}</td>
                    <td className="px-4 py-4 text-gray-400">
                      <div className="flex flex-wrap gap-1">
                        {f.equipments?.slice(0, 2).map((e, i) => (
                          <span key={i} className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                            {e}
                          </span>
                        ))}
                        {f.equipments?.length > 2 && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">+{f.equipments.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] uppercase rounded-lg font-bold
                          ${f.active
                            ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                            : "bg-gray-500/20 text-gray-400 ring-1 ring-gray-500/30"
                          }`}
                      >
                        {f.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 flex justify-center items-center gap-2">
                      <FaCheckCircle
                        onClick={() => toggleStatus(f.id, f.active)}
                        className={`cursor-pointer text-xl transition ${f.active
                            ? "text-emerald-400 hover:scale-110"
                            : "text-gray-500 hover:scale-110"
                          }`}
                        title={f.active ? "Toggle to Inactive" : "Toggle to Active"}
                      />
                      <button
                        onClick={() => navigate(`/admin/addfecilities/${f.id}`)}
                        className="p-2 rounded-lg bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500 hover:text-white transition"
                        title="Edit Facility"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(f.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition"
                        title="Delete Facility"
                      >
                        <FaTrash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilitiesAll;
