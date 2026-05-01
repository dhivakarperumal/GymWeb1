import React, { useEffect, useState } from "react";
import { 
  Plus, Search, Trash2, Edit2, Image as ImageIcon, ArrowLeft, 
  ChevronLeft, ChevronRight, History, MoreHorizontal, ChevronDown
} from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const Offers = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("plan"); // plan or product
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [viewMode, setViewMode] = useState("table"); // table or card
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [form, setForm] = useState({
    offer_name: "",
    offer_type: "plan",
    target_id: "",
    discount_percentage: 0,
    description: "",
    offer_image: "",
    active: 1,
    start_date: "",
    end_date: "",
    promo_type: "discount",
    contact: ""
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [offersRes, plansRes, productsRes] = await Promise.all([
        api.get("/offers"),
        api.get("/plans"),
        api.get("/products")
      ]);
      setOffers(offersRes.data);
      setPlans(plansRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 800,
      });
      const base64 = await imageCompression.getDataUrlFromFile(compressed);
      setForm({ ...form, offer_image: base64 });
    } catch (err) {
      toast.error("Image upload failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.offer_name || !form.target_id) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      if (form.id) {
        await api.put(`/offers/${form.id}`, form);
        toast.success("Offer updated");
      } else {
        await api.post("/offers", form);
        toast.success("Offer created");
      }
      closeModal();
      loadData();
    } catch (err) {
      toast.error("Failed to save offer");
    }
  };

  const deleteOffer = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/offers/${id}`);
      toast.success("Offer deleted");
      loadData();
    } catch (err) {
      toast.error("Failed to delete offer");
    }
  };

  const openModal = (offer = null) => {
    if (offer) {
      setForm({
        ...offer,
        start_date: offer.start_date ? dayjs(offer.start_date).format("YYYY-MM-DD") : "",
        end_date: offer.end_date ? dayjs(offer.end_date).format("YYYY-MM-DD") : "",
      });
    } else {
      setForm({
        offer_name: "",
        offer_type: type,
        target_id: "",
        discount_percentage: 0,
        description: "",
        offer_image: "",
        active: 1,
        start_date: dayjs().format("YYYY-MM-DD"),
        end_date: dayjs().add(1, 'month').format("YYYY-MM-DD"),
        promo_type: "discount",
        contact: ""
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setForm({
      offer_name: "",
      offer_type: type,
      target_id: "",
      discount_percentage: 0,
      description: "",
      offer_image: "",
      active: 1,
      start_date: "",
      end_date: "",
      promo_type: "discount",
      contact: ""
    });
  };

  const filteredOffers = offers.filter(o => {
    const matchesType = o.offer_type === type;
    const matchesSearch = o.offer_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? o.active : !o.active);
    return matchesType && matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);
  const paginatedOffers = filteredOffers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const targets = type === "plan" ? plans : products;

  const getStatusBadge = (active) => {
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
        {active ? "Active" : "Inactive"}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 text-white min-h-screen relative flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95 shadow-lg">
              <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-2xl font-black tracking-tight">Marketing Offers</h2>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-0.5">Campaign & Discount Management</p>
          </div>
        </div>

        <button 
          onClick={() => openModal()}
          className="px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest bg-gradient-to-r from-orange-500 to-rose-600 shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Add New Offer
        </button>
      </div>

      {/* FILTERS BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xl">
        <div className="lg:col-span-3 flex bg-black/40 p-1 rounded-xl border border-white/5 shadow-inner">
          <button 
            onClick={() => { setType("plan"); setCurrentPage(1); }}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${type === "plan" ? "bg-orange-500 text-white shadow-lg" : "text-white/40 hover:text-white"}`}
          >
            Plans
          </button>
          <button 
            onClick={() => { setType("product"); setCurrentPage(1); }}
            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${type === "product" ? "bg-orange-500 text-white shadow-lg" : "text-white/40 hover:text-white"}`}
          >
            Products
          </button>
        </div>

        <div className="lg:col-span-4 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search campaign name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm placeholder:text-white/20"
          />
        </div>

        <div className="lg:col-span-3 relative group">
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full bg-transparent border border-white/10 rounded-xl pl-4 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm appearance-none cursor-pointer"
          >
            <option value="all" className="bg-neutral-900">All Status</option>
            <option value="active" className="bg-neutral-900">Active Only</option>
            <option value="inactive" className="bg-neutral-900">Inactive Only</option>
          </select>
          <MoreHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>

        <div className="lg:col-span-2 flex justify-end gap-2 p-1 bg-black/20 rounded-xl border border-white/5">
          <button 
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-orange-500 text-white shadow-lg" : "text-white/40 hover:text-white"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </button>
          <button 
            onClick={() => setViewMode("card")}
            className={`p-2 rounded-lg transition-all ${viewMode === "card" ? "bg-orange-500 text-white shadow-lg" : "text-white/40 hover:text-white"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-4">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 animate-pulse">Syncing Database...</p>
          </div>
        ) : paginatedOffers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl py-24">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 text-4xl">🏷️</div>
            <h3 className="text-xl font-black text-white mb-2">No Campaigns Found</h3>
          </div>
        ) : viewMode === "table" ? (
          <div className="flex-1 overflow-y-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white/5 backdrop-blur-xl z-10 border-b border-white/10">
                <tr className="text-white/40 uppercase text-[10px] tracking-[0.2em] font-black">
                  <th className="px-6 py-4">S.No</th>
                  <th className="px-6 py-4">Campaign Details</th>
                  <th className="px-6 py-4">Validity</th>
                  <th className="px-6 py-4">Linked Item</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedOffers.map((o, idx) => {
                  const target = (o.offer_type === "plan" ? plans : products).find(t => t.id == o.target_id);
                  return (
                    <tr key={o.id} className="group hover:bg-white/5 transition-all cursor-pointer" onClick={() => openModal(o)}>
                      <td className="px-6 py-6 text-xs font-bold text-white/30">
                        {String((currentPage - 1) * itemsPerPage + idx + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 overflow-hidden flex items-center justify-center">
                            {o.offer_image ? <img src={o.offer_image} className="h-full w-full object-cover" /> : <ImageIcon size={18} className="text-white/20" />}
                          </div>
                          <div>
                            <p className="font-black text-base text-white group-hover:text-orange-500 transition-colors leading-tight">{o.offer_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest bg-orange-400/10 px-2 py-0.5 rounded w-fit">{o.discount_percentage}% OFF</p>
                               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-400/10 px-2 py-0.5 rounded w-fit">{o.promo_type}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white/60">{o.start_date ? dayjs(o.start_date).format("MMM DD") : "N/A"} - {o.end_date ? dayjs(o.end_date).format("MMM DD, YYYY") : "N/A"}</span>
                          <span className="text-[9px] text-white/20 font-black uppercase mt-1">{o.contact || "No Contact"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className="text-xs font-black text-white/70 uppercase">{target?.name || "Unavailable"}</span>
                      </td>
                      <td className="px-6 py-6 text-center">{getStatusBadge(o.active)}</td>
                      <td className="px-6 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openModal(o)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-orange-500 transition-all"><Edit2 size={16} /></button>
                          <button onClick={() => deleteOffer(o.id)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedOffers.map(o => {
                const target = (o.offer_type === "plan" ? plans : products).find(t => t.id == o.target_id);
                return (
                  <div key={o.id} className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-orange-500/50 transition-all flex flex-col h-full shadow-2xl relative">
                    <div className="relative h-44 overflow-hidden">
                      {o.offer_image ? <img src={o.offer_image} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" /> : <div className="h-full w-full bg-white/5 flex items-center justify-center text-5xl opacity-20">🏷️</div>}
                      <div className="absolute top-4 right-4">{getStatusBadge(o.active)}</div>
                      <div className="absolute bottom-4 left-4 flex flex-col gap-1">
                         <div className="bg-orange-600 text-white px-3 py-1.5 rounded-xl text-lg font-black shadow-orange-600/40 w-fit">{o.discount_percentage}% OFF</div>
                         <div className="bg-black/60 backdrop-blur-md text-white/80 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest w-fit">{o.promo_type}</div>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col relative">
                      <div className="mb-4">
                        <h4 className="text-xl font-black group-hover:text-orange-500 transition leading-tight">{o.offer_name}</h4>
                        <p className="text-[10px] text-white/30 font-black uppercase mt-1">{target?.name || "Unknown Item"}</p>
                      </div>
                      <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-4 flex-1">{o.description || "No description provided."}</p>
                      <div className="space-y-2 mb-6 border-t border-white/5 pt-4">
                        <div className="flex justify-between text-[10px] font-black uppercase text-white/20"><span>Validity</span><span className="text-white/40">{dayjs(o.start_date).format("MMM DD")} - {dayjs(o.end_date).format("MMM DD")}</span></div>
                        {o.contact && <div className="flex justify-between text-[10px] font-black uppercase text-white/20"><span>Support</span><span className="text-white/40">{o.contact}</span></div>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openModal(o)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Edit</button>
                        <button onClick={() => deleteOffer(o.id)} className="w-12 flex items-center justify-center py-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && filteredOffers.length > 0 && (
          <div className="p-4 bg-white/5 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/10">
            <div className="text-[10px] text-white/30 font-black uppercase tracking-widest">
              Showing <span className="text-white/60">{(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredOffers.length)}</span> of <span className="text-white/60">{filteredOffers.length}</span> Campaigns
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} className="text-white/20 text-sm font-black">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-10 h-10 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        currentPage === p
                          ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )
              }

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeModal} />
          <div className="relative w-full max-w-4xl bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-2xl font-black flex items-center gap-3">{form.id ? "Edit Campaign" : "Launch New Campaign"}</h3>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-1">Configure your promotional campaign parameters</p>
              </div>
              <button onClick={closeModal} className="text-white/40 hover:text-white transition-all text-2xl">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest border-b border-orange-500/20 pb-2">1. Core Identity</h4>
                  <div><label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Campaign Name</label><input type="text" required value={form.offer_name} onChange={(e) => setForm({...form, offer_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500/50 outline-none text-sm font-bold" /></div>
                  <div><label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Offer Type</label><select value={form.promo_type} onChange={(e) => setForm({...form, promo_type: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-sm font-bold appearance-none bg-neutral-900"><option value="discount">Direct Discount</option><option value="free">Free Months / Items</option><option value="combo">Combo Package</option></select></div>
                  <div><label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Contact / Support</label><input type="text" value={form.contact} onChange={(e) => setForm({...form, contact: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500/50 outline-none text-sm font-bold" /></div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest border-b border-orange-500/20 pb-2">2. Targets & Rules</h4>
                  <div><label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Target {type === "plan" ? "Plan" : "Product"}</label><select required value={form.target_id} onChange={(e) => setForm({...form, target_id: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-sm font-bold appearance-none bg-neutral-900"><option value="">Select Target...</option>{targets.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}</select></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Discount %</label><input type="number" required value={form.discount_percentage} onChange={(e) => setForm({...form, discount_percentage: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-orange-500/50 outline-none text-sm font-black text-orange-500" /></div>
                    <div><label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Status</label><select value={form.active} onChange={(e) => setForm({...form, active: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-sm font-bold appearance-none bg-neutral-900"><option value={1}>Active</option><option value={0}>Draft</option></select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Start Date</label><input type="date" required value={form.start_date} onChange={(e) => setForm({...form, start_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-xs font-bold" /></div>
                    <div><label className="text-[10px] font-black text-white/40 uppercase mb-2 block">End Date</label><input type="date" required value={form.end_date} onChange={(e) => setForm({...form, end_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none text-xs font-bold" /></div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest border-b border-orange-500/20 pb-2">3. Media & Copy</h4>
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase mb-2 block ml-1">Campaign Image</label>
                    <label className="cursor-pointer group block">
                      <div className="w-full aspect-video bg-white/5 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center hover:bg-white/10 hover:border-orange-500/50 transition-all relative overflow-hidden">
                        {form.offer_image ? <img src={form.offer_image} className="w-full h-full object-cover" /> : <><ImageIcon size={32} className="text-white/10 mb-2 group-hover:text-orange-500" /><span className="text-[10px] font-black uppercase text-white/20">Upload Asset</span></>}
                      </div>
                      <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </label>
                  </div>
                  <div><label className="text-[10px] font-black text-white/40 uppercase mb-2 block">Marketing Copy</label><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none h-32 text-sm font-medium resize-none" placeholder="Enter campaign message..." /></div>
                </div>
              </div>
              <div className="flex gap-4 pt-8 border-t border-white/5">
                <button type="button" onClick={closeModal} className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Discard</button>
                <button type="submit" className="flex-[2] py-5 bg-gradient-to-r from-orange-500 to-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-orange-600/30 hover:brightness-110 active:scale-95 transition-all text-white">{form.id ? "Update Campaign" : "Launch Now"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Offers;
