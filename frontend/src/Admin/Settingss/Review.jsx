import React, { useState, useEffect } from "react";
import {
  FaStar,
  FaTrash,
  FaPlus,
  FaArrowLeft,
  FaImage,
  FaCheckCircle,
  FaSearch,
  FaEdit,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import api from "../../api";

/* ================= STYLES ================= */
const glassCard =
  "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]";

const glassInput =
  "w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-white/30";

const ReviewsSettings = () => {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'card' or 'table'

  const [form, setForm] = useState({
    name: "",
    rating: 0,
    message: "",
    image: "",
  });

  /* ================= FETCH ================= */
  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews');
      setReviews(res.data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      toast.error('Failed to load reviews');
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  /* ================= IMAGE ================= */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onloadend = () =>
        setForm((p) => ({ ...p, image: reader.result }));
      reader.readAsDataURL(compressed);
    } catch {
      toast.error("Image upload failed");
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.rating) {
      toast.error("Please select rating");
      return;
    }

    try {
      if (editId) {
        await api.put(`/reviews/${editId}`, {
          name: form.name,
          rating: Number(form.rating),
          message: form.message,
          image: form.image,
        });
        toast.success("Review updated");
      } else {
        await api.post('/reviews', {
          name: form.name,
          rating: Number(form.rating),
          message: form.message,
          image: form.image,
          status: 0,
        });
        toast.success("Review added");
      }

      setForm({ name: "", rating: 0, message: "", image: "" });
      setEditId(null);
      setShowModal(false);
      fetchReviews();
    } catch (err) {
      console.error('Error saving review:', err);
      toast.error(err.response?.data?.error || "Something went wrong");
    }
  };

  const handleEdit = (r) => {
    setEditId(r.id);
    setForm({
      name: r.name,
      rating: r.rating,
      message: r.message,
      image: r.image || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success("Deleted");
      fetchReviews();
    } catch (err) {
      console.error('Error deleting review:', err);
      toast.error("Failed to delete review");
    }
  };

  const toggleStatus = async (review) => {
    try {
      await api.put(`/reviews/${review.id}`, {
        name: review.name,
        rating: review.rating,
        message: review.message,
        image: review.image,
        status: !review.status,
      });

      fetchReviews();
    } catch (err) {
      console.error("Error updating review status:", err);
      toast.error("Failed to update review status");
    }
  };

  const filtered = reviews.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.message?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-white">

      {/* HEADER */}
      <button
        onClick={() => navigate("/admin/settings")}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition"
      >
        <FaArrowLeft /> Back
      </button>

      {/* SEARCH + ADD + VIEW TOGGLE */}
      <div className="flex justify-between gap-4 flex-wrap items-center">
        <div className="flex gap-4 items-center flex-1 max-w-xl">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search member feedback..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`${glassInput} pl-11`}
            />
          </div>

          <div className="flex bg-white/10 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode("card")}
              className={`p-2 px-3 rounded-lg transition ${viewMode === "card" ? "bg-orange-500 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
              title="Card View"
            >
              <FaThLarge />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 px-3 rounded-lg transition ${viewMode === "table" ? "bg-orange-500 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
              title="Table View"
            >
              <FaList />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-8 py-3 rounded-xl text-white font-semibold
bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105 transition shadow-lg"
        >
          <FaPlus className="inline mr-2" />
          Add Review
        </button>
      </div>

      {/* LIST CONTENT */}
      {viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((r) => (
            <div key={r.id} className={`${glassCard} p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500`}>

              <div className="flex justify-between items-start">
                {/* IMAGE */}
                {r.image ? (
                  <img
                    src={r.image}
                    className="w-14 h-14 rounded-full object-cover border-2 border-orange-500/50 shadow-lg shadow-orange-500/10"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                    <FaImage className="text-gray-400" />
                  </div>
                )}

                {/* STATUS BADGE */}
                <button
                  onClick={() => toggleStatus(r)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${r.status ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-gray-500/10 text-gray-400 border border-white/10"}`}
                >
                  {r.status ? "Approved" : "Pending"}
                </button>
              </div>

              {/* CONTENT */}
              <div className="flex-1 space-y-2">
                <div>
                  <h3 className="font-bold text-white truncate" title={r.name}>{r.name}</h3>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <FaStar
                        key={i}
                        className={
                          i <= r.rating
                            ? "text-yellow-400 text-xs drop-shadow-[0_0_3px_rgba(250,204,21,0.5)]"
                            : "text-gray-600 text-xs"
                        }
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-gray-400 line-clamp-3 italic leading-relaxed min-h-[3rem]">
                  "{r.message}"
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => handleEdit(r)}
                  className="flex-1 flex items-center justify-center py-2 rounded-lg bg-white/5 hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400 transition border border-white/5 hover:border-yellow-500/20"
                >
                  <FaEdit className="text-sm mr-2" /> <span className="text-xs">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="flex-1 flex items-center justify-center py-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition border border-white/5 hover:border-red-500/20"
                >
                  <FaTrash className="text-sm mr-2" /> <span className="text-xs">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${glassCard} overflow-hidden animate-in fade-in zoom-in-95 duration-500`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-gray-300 uppercase text-xs tracking-wider">
                  <th className="p-4 font-semibold">Member</th>
                  <th className="p-4 font-semibold">Feedback</th>
                  <th className="p-4 font-semibold">Rating</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {r.image ? (
                          <img src={r.image} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs text-gray-400">
                            <FaImage />
                          </div>
                        )}
                        <span className="font-medium group-hover:text-orange-400 transition-colors">{r.name}</span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-sm text-gray-400 truncate" title={r.message}>{r.message}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-0.5 text-xs">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <FaStar key={i} className={i <= r.rating ? "text-yellow-400" : "text-gray-600"} />
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleStatus(r)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter transition-all ${r.status ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-gray-500/10 text-gray-400 border border-white/10"}`}
                      >
                        {r.status ? "Approved" : "Pending"}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(r)}
                          className="p-2 rounded-lg hover:bg-yellow-500/20 text-yellow-400 transition"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          <p className="text-gray-400">No gym reviews found matching your criteria</p>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <form
            onSubmit={handleSubmit}
            className={`${glassCard} w-full max-w-md p-6 space-y-4`}
          >
            <h3 className="text-lg font-semibold">
              {editId ? "Edit Review" : "Add Gym Review"}
            </h3>

            <input
              placeholder="Member name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={glassInput}
              required
            />

            <input type="file" accept="image/*" onChange={handleImageUpload} />

            {form.image && (
              <img
                src={form.image}
                className="w-20 h-20 rounded-full"
              />
            )}

            {/* RATING */}
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <FaStar
                  key={i}
                  onClick={() => setForm({ ...form, rating: i })}
                  className={`cursor-pointer text-2xl ${i <= form.rating
                    ? "text-yellow-400"
                    : "text-gray-500"
                    }`}
                />
              ))}
            </div>

            <textarea
              placeholder="Member feedback"
              rows={3}
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
              className={glassInput}
              required
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20"
              >
                Cancel
              </button>
              <button className="px-8 py-3 rounded-xl text-white font-semibold
bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-105 transition shadow-lg">
                {editId ? "Update" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReviewsSettings;
