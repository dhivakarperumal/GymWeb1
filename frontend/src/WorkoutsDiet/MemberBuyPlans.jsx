import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../src/PrivateRouter/AuthContext";
import api from "../../src/api";
import { Trash2 } from "lucide-react";

const MemberSBuyPlans = ({ preFetchedPlans, memberData }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plans, setPlans] = useState(preFetchedPlans || []);
  const [loading, setLoading] = useState(!preFetchedPlans);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  // Split membership rows that contain both a normal plan and a PT plan into separate cards.
  // Also merge standalone PT plans from memberData if not already present.
  const expandAndMergePlans = (memberships, member) => {
    const expanded = [];

    memberships.forEach((m) => {
      // Check if this membership row has a PT plan embedded
      const hasPt = m.has_pt_plan || m.pt_planId || m.pt_planName;
      const hasNormal = m.planId || m.planName;

      if (hasNormal) {
        expanded.push(m); // normal plan card as-is
      }

      if (hasPt && m.pt_planName) {
        // Create a separate card for the PT plan using pt_ fields
        expanded.push({
          id: `pt-ms-${m.id}`,
          planName: m.pt_planName,
          price: Number(m.pt_price ?? 0),
          pricePaid: Number(m.pt_pricePaid ?? 0),
          duration: m.pt_duration || null,
          startDate: m.pt_startDate || null,
          endDate: m.pt_endDate || null,
          status: m.pt_status || 'active',
          paymentMode: m.pt_paymentMode || null,
          paymentStatus: m.pt_paymentStatus || null,
          trainerId: m.pt_trainerId || null,
          trainerName: m.pt_trainerName || null,
          isPtPlan: true,
        });
      }

      // If the row has neither normal nor PT plan name, still show it
      if (!hasNormal && !hasPt) {
        expanded.push(m);
      }
    });

    // Also merge a PT plan from gym_members if it exists and isn't already covered
    if (member && member.pt_status) {
      const ptActive = String(member.pt_status).toLowerCase() === 'active';
      const hasPlanName = Boolean(member.pt_plan);
      const hasValidDates = Boolean(member.pt_join_date && member.pt_expiry_date);
      if (ptActive && hasPlanName && hasValidDates) {
        const exists = expanded.some(
          (p) => p.isPtPlan && (
            String(p.planName || '').toLowerCase() === String(member.pt_plan || '').toLowerCase()
          )
        );
        if (!exists) {
          expanded.push({
            id: `pt-${member.member_id}`,
            planName: member.pt_plan,
            price: Number(member.pt_price ?? member.pt_pricePaid ?? 0),
            duration: member.pt_duration || null,
            startDate: member.pt_join_date || null,
            endDate: member.pt_expiry_date || null,
            status: member.pt_status || 'ACTIVE',
            isPtPlan: true,
          });
        }
      }
    }

    return expanded;
  };

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get("/products");
        const list = Array.isArray(res.data) ? res.data : [];
        setFeaturedProducts(list.slice(0, 4));
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchFeatured();

    const shouldUsePreFetchedPlans = Array.isArray(preFetchedPlans) && preFetchedPlans.length > 0;
    if (!user?.id) return;

    if (shouldUsePreFetchedPlans) {
      setPlans(expandAndMergePlans(preFetchedPlans, memberData));
      setLoading(false);
      return;
    }

    const fetchMemberships = async () => {
      try {
        const res = await api.get(`/memberships/user/${user.id}`);
        let memberships = Array.isArray(res.data) ? res.data : [];
        memberships = expandAndMergePlans(memberships, memberData);
        setPlans(memberships);
      } catch (err) {
        console.error("Failed to fetch memberships", err);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberships();
  }, [user, preFetchedPlans, memberData]);

  const formatPlanDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleDelete = async (plan) => {
    const confirmDelete = window.confirm("Delete this plan?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/memberships/${plan.id}`);

      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    } catch (err) {
      console.log(err.response?.data);
      alert("Delete failed");
    }

  };

  return (
    <>
      <div className="bg-black text-white min-h-screen py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-red-500">
            My Plans
          </h2>

          <p className="text-gray-400 mt-2">
            Your purchased membership plans
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-4 bg-gray-800 w-32 mb-4 rounded"></div>
              <div className="h-2 bg-gray-800 w-48 rounded"></div>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center p-12 bg-gray-900/50 rounded-2xl border border-red-500/10 max-w-2xl mx-auto">
            <h2 className="text-xl text-red-500 font-bold">
              No Active Plans
            </h2>
            <p className="text-gray-400 mt-2">
              Unlock your full potential with our premium membership plans.
            </p>
            <button
              onClick={() => navigate("/pricing")}
              className="mt-6 bg-red-600 hover:bg-red-700 px-8 py-3 rounded-full font-bold transition shadow-lg shadow-red-600/20"
            >
              🚀 Explore Plans
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 px-4">
            {plans.map((plan) => {
              const price = Number(plan.price || plan.pricePaid || plan.pt_price || plan.pt_pricePaid || 0);
              const start = formatPlanDate(plan.startDate);
              const end = formatPlanDate(plan.endDate);
              const endDate = plan.endDate ? new Date(plan.endDate) : null;
              const isExpired = endDate instanceof Date && !Number.isNaN(endDate.getTime()) && endDate < new Date();

              return (
                <div
                  key={plan.id}
                  className="group relative bg-gradient-to-br from-gray-900 to-black border border-red-500/20 p-8 rounded-2xl transition hover:border-red-500/40 shadow-xl"
                >
                  <button
                    onClick={() => handleDelete(plan)}
                    className={`absolute top-4 right-6 p-2 rounded-full transition ${isExpired
                      ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white cursor-pointer"
                      : "text-gray-700 cursor-not-allowed opacity-30"
                      }`}
                    title={isExpired ? "Remove expired plan" : "Active plans cannot be deleted"}
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-black text-white group-hover:text-red-500 transition">
                      {plan.planName}
                    </h3>
                    <span
                      className={`absolute top-6 right-16 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest ${isExpired
                          ? "bg-gray-800 text-gray-400"
                          : "bg-red-600 text-white animate-pulse"
                        }`}
                    >
                      {isExpired ? "EXPIRED" : (plan.status || '').toString().toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]">₹{price.toLocaleString("en-IN")}</span>
                      {plan.duration && (
                        <span className="text-sm text-gray-500 font-bold tracking-tight">/ {plan.duration}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                      <div>
                        <p className="text-[10px] uppercase text-gray-500 font-bold">Started On</p>
                        <p className="text-sm text-gray-200">{start}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-500 font-bold">Expires On</p>
                        <p className="text-sm text-gray-200">{end}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FEATURED PRODUCTS SECTION ("products all show") */}
        <div className="mt-24 px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white">Supplements & Gear</h3>
              <p className="text-gray-400 text-sm">Boost your performance with our top-rated products</p>
            </div>
            <button
              onClick={() => navigate("/products")}
              className="text-red-500 font-bold hover:underline text-sm"
            >
              View Shop
            </button>
          </div>

          {/* We'll just show a couple of placeholders or fetch them if needed */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredProducts.length > 0 ? (
              featuredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => navigate("/products")}
                  className="bg-gray-900/40 border border-white/5 p-4 rounded-xl text-center cursor-pointer hover:border-red-500/30 transition group"
                >
                  <div className="w-full aspect-square bg-gray-800 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={prod.image || prod.images?.[0] || "https://via.placeholder.com/150"}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      alt={prod.name}
                    />
                  </div>
                  <p className="text-sm font-bold text-white truncate">{prod.name}</p>
                  <p className="text-xs text-red-500 font-black mt-1">
                    ₹{prod.offer_price || prod.offerPrice || prod.mrp || "0"}
                  </p>
                </div>
              ))
            ) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-900/40 border border-white/5 p-4 rounded-xl text-center">
                  <div className="w-full aspect-square bg-gray-800 rounded-lg mb-3 animate-pulse"></div>
                  <div className="h-3 bg-gray-800 w-2/3 mx-auto mb-2 rounded"></div>
                  <div className="h-2 bg-gray-800 w-1/3 mx-auto rounded"></div>
                </div>
              ))
            )}
          </div>
        </div>


      </div>
    </>
  );
};

export default MemberSBuyPlans;