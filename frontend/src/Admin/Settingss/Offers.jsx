import React, { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaEdit, FaImage, FaArrowLeft } from "react-icons/fa";
import api from "../../api";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { useNavigate } from "react-router-dom";

const Offers = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("plan"); // plan or product
  
  const [form, setForm] = useState({
    offer_name: "",
    offer_type: "plan",
    target_id: "",
    discount_percentage: 0,
    description: "",
    offer_image: "",
    active: 1
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
      setForm({
        offer_name: "",
        offer_type: type,
        target_id: "",
        discount_percentage: 0,
        description: "",
        offer_image: "",
        active: 1
      });
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

  const editOffer = (offer) => {
    setForm(offer);
    setType(offer.offer_type);
  };

  const filteredOffers = offers.filter(o => o.offer_type === type);
  const targets = type === "plan" ? plans : products;

  return (
    <div className="p-6 space-y-6 text-white min-h-screen">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition">
            <FaArrowLeft />
        </button>
        <h2 className="text-2xl font-bold">Offer Management</h2>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={() => { setType("plan"); setForm({...form, offer_type: "plan", target_id: ""}) }}
          className={`px-6 py-2 rounded-xl font-bold transition ${type === "plan" ? "bg-orange-500 text-white" : "bg-white/5 text-gray-400"}`}
        >
          Plan Offers
        </button>
        <button 
          onClick={() => { setType("product"); setForm({...form, offer_type: "product", target_id: ""}) }}
          className={`px-6 py-2 rounded-xl font-bold transition ${type === "product" ? "bg-orange-500 text-white" : "bg-white/5 text-gray-400"}`}
        >
          Product Offers
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* LEFT: FORM */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 h-fit lg:sticky lg:top-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            {form.id ? <FaEdit /> : <FaPlus />} {form.id ? "Edit Offer" : "Add New Offer"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Offer Name</label>
              <input 
                type="text" 
                value={form.offer_name}
                onChange={(e) => setForm({...form, offer_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="e.g. Summer Special 40% Off"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Select {type === "plan" ? "Plan" : "Product"}</label>
              <select 
                value={form.target_id}
                onChange={(e) => setForm({...form, target_id: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="" className="bg-gray-900">Select {type === "plan" ? "Plan" : "Product"}</option>
                {targets.map(t => (
                  <option key={t.id} value={t.id} className="bg-gray-900">{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Discount %</label>
                <input 
                  type="number" 
                  value={form.discount_percentage}
                  onChange={(e) => setForm({...form, discount_percentage: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <select 
                  value={form.active}
                  onChange={(e) => setForm({...form, active: parseInt(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value={1} className="bg-gray-900">Active</option>
                  <option value={0} className="bg-gray-900">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Description</label>
              <textarea 
                value={form.description}
                onChange={(e) => setForm({...form, description: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none h-24"
                placeholder="Describe the offer details..."
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Offer Banner / Image</label>
              <div className="flex gap-4 items-center">
                <label className="flex-1 cursor-pointer bg-white/5 border border-dashed border-white/20 rounded-xl p-4 hover:bg-white/10 transition text-center">
                  <FaImage className="mx-auto mb-2 text-2xl text-gray-400" />
                  <span className="text-sm text-gray-400">Click to upload</span>
                  <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                </label>
                {form.offer_image && (
                  <div className="h-24 w-24 rounded-xl border border-white/20 overflow-hidden relative group">
                    <img src={form.offer_image} alt="preview" className="h-full w-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setForm({...form, offer_image: ""})}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <FaTrash className="text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition active:scale-95"
            >
              {form.id ? "Update Offer" : "Save Offer"}
            </button>
            {form.id && (
              <button 
                type="button" 
                onClick={() => setForm({
                  offer_name: "",
                  offer_type: type,
                  target_id: "",
                  discount_percentage: 0,
                  description: "",
                  offer_image: "",
                  active: 1
                })}
                className="w-full py-3 text-gray-400 hover:text-white transition"
              >
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* RIGHT: TABLE */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 overflow-hidden">
          <h3 className="text-xl font-bold mb-6">Current Offers</h3>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-orange-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm">
                    <th className="pb-4 pr-4">Offer</th>
                    <th className="pb-4 pr-4">Target</th>
                    <th className="pb-4 pr-4 text-center">Status</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOffers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-500">No offers found for {type}s</td>
                    </tr>
                  ) : (
                    filteredOffers.map(o => {
                      const target = (o.offer_type === "plan" ? plans : products).find(t => t.id == o.target_id);
                      return (
                        <tr key={o.id} className="group hover:bg-white/5 transition">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              {o.offer_image && <img src={o.offer_image} className="h-10 w-10 rounded object-cover border border-white/10" />}
                              <div>
                                <p className="font-bold">{o.offer_name}</p>
                                <p className="text-xs text-orange-400">{o.discount_percentage}% OFF</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="text-sm">{target?.name || "Unknown"}</span>
                          </td>
                          <td className="py-4 pr-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${o.active ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                              {o.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            <button onClick={() => editOffer(o)} className="p-2 text-gray-400 hover:text-white transition"><FaEdit /></button>
                            <button onClick={() => deleteOffer(o.id)} className="p-2 text-gray-400 hover:text-red-500 transition"><FaTrash /></button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Offers;
