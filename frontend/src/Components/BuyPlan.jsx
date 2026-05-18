import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../PrivateRouter/AuthContext";
import api from "../api";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import AOS from "aos";
import "aos/dist/aos.css";
import PricingCard from "./PricingCard";

const BuyPlan = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user, profileName } = useAuth();

  const plan = state?.plan;

  const today = new Date().toISOString().split("T")[0];

  const [plans, setPlans] = useState([]);
  const [planSearch, setPlanSearch] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(plan || null);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [discount, setDiscount] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentPlan = selectedPlan || plan;
  const price = Number(currentPlan?.final_price || currentPlan?.price || 0);

  const [form, setForm] = useState({
    name: profileName || user?.username || "",
    email: user?.email || "",
    phone: "",
    address: "",
    startDate: today,
    endDate: "",
  });

  const parseDecimal = (value) => {
    if (value == null) return 0;
    const raw = typeof value === "string" ? value.replace(/[^0-9.\-]/g, "") : value;
    const number = Number(raw);
    return Number.isFinite(number) ? number : 0;
  };

  const filteredPlans = plans.filter((p) => {
    const query = planSearch.trim().toLowerCase();
    if (!query) return true;
    return [p.name, p.duration, p.price, p.final_price, p.description]
      .filter(Boolean)
      .some((value) => value.toString().toLowerCase().includes(query));
  });

  /* ================= PAGE PROTECTION ================= */

  useEffect(() => {
    if (!user) {
      navigate("/login", {
        state: { message: "Please login to purchase a plan" },
      });
    }

    if (!plan) {
      navigate("/pricing");
    }
  }, [user, plan, navigate]);

  /* ================= CHECK ENQUIRY ================= */

  /* ================= FETCH USER PROFILE ================= */

  useEffect(() => {
    if (!user?.id) return;

    const fetchUserProfile = async () => {
      try {
        const res = await api.get(`/users/${user.id}`);

        if (res.data) {
          setForm((prev) => ({
            ...prev,
            phone: res.data.mobile || "",
            name: res.data.username || prev.name,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get("/plans");
        const list = Array.isArray(res.data) ? res.data : [];
        setPlans(list.filter((plan) => plan.active !== false));
      } catch (err) {
        console.error("Failed to fetch plans", err);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    if (!height || !weight) {
      setBmi("");
      return;
    }

    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 0 && w > 0) {
      setBmi(((w / (h * h)) * 10000).toFixed(1));
    }
  }, [height, weight]);

  useEffect(() => {
    if (!selectedPlan) return;

    const days = parseInt(selectedPlan.duration, 10) || 30;
    const start = new Date(form.startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + days * 30);

    setForm((prev) => ({
      ...prev,
      endDate: end.toISOString().split("T")[0],
    }));
  }, [selectedPlan, form.startDate]);

  /* ================= LOAD RAZORPAY ================= */

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");

      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  /* ================= PAYMENT ================= */

  const handlePayment = async () => {
    if (!selectedPlan) {
      alert("Please select a plan to purchase.");
      return;
    }

    if (!form.address) {
      alert("Please enter your address before purchasing a plan.");
      return;
    }

    if (!form.phone || form.phone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    const razorpayLoaded = await loadRazorpay();

    if (!razorpayLoaded) {
      alert("Razorpay SDK failed to load");
      return;
    }

    const selectedPrice = Number(selectedPlan?.final_price || selectedPlan?.price || 0);
    const discountValue = parseDecimal(discount);
    const amountPayable = Math.max(0, selectedPrice - discountValue);

    const options = {
      key: "rzp_test_2ORD27rb7vGhwj",
      amount: amountPayable * 100,
      currency: "INR",
      name: "Gym Membership",
      description: selectedPlan?.name || "Membership",

      handler: async (response) => {
        try {
          await api.post("/memberships", {
            userId: user.id,
            planId: selectedPlan.id,
            planName: selectedPlan.name,
            price: selectedPrice,
            pricePaid: amountPayable,
            duration: selectedPlan.duration,
            startDate: form.startDate,
            endDate: form.endDate,
            paymentId: response.razorpay_payment_id,
            paymentMode: paymentMode,
            status: "active",
          });

          navigate("/account", {
            state: { tab: "myplans" },
          });

        } catch (err) {
          console.error("Plan save error:", err);
          alert("Payment successful but failed to save plan.");
        }
      },

      prefill: {
        name: form.name,
        email: form.email,
        contact: form.phone,
      },

      theme: {
        color: "#dc2626",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  /* ================= AOS ================= */

  useEffect(() => {
    AOS.init({
      duration: 900,
      easing: "ease-out-cubic",
      once: true,
      offset: 120,
    });
  }, []);

  return (
    <>
      <PageHeader
        title="Buy Membership Plan"
        subtitle="Complete your enrollment and start your fitness journey today"
        bgImage="https://images.unsplash.com/photo-1599058917212-d750089bc07e"
      />

      <div className="bg-black text-white min-h-screen">
        <PageContainer>
          <div className="py-10">

            <h1 className="text-3xl font-bold mb-6">
              Buy Membership Plan
            </h1>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">

              {/* FORM */}
              <div data-aos="fade-right">
                <div className="bg-black/80 border border-red-500/40 rounded-2xl p-6 shadow-xl">
                  <p className="text-white/60 mb-3 text-sm">
                    Complete your membership purchase using the plan details below.
                  </p>

                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        value={form.name}
                        readOnly
                        className="p-3 bg-gray-900 rounded-lg"
                      />
                      <input
                        type="tel"
                        placeholder="Mobile Number"
                        value={form.phone}
                        maxLength={10}
                        className="p-3 bg-gray-900 rounded-lg"
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          setForm({ ...form, phone: value });
                        }}
                      />
                    </div>

                    <input
                      value={form.email}
                      readOnly
                      className="w-full p-3 bg-gray-900 rounded-lg"
                    />

                    <textarea
                      placeholder="Address"
                      rows={3}
                      value={form.address}
                      className="w-full p-3 bg-gray-900 rounded-lg"
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="Height (cm)"
                        value={height}
                        className="p-3 bg-gray-900 rounded-lg"
                        onChange={(e) => setHeight(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Weight (kg)"
                        value={weight}
                        className="p-3 bg-gray-900 rounded-lg"
                        onChange={(e) => setWeight(e.target.value)}
                      />
                      <input
                        value={bmi}
                        readOnly
                        placeholder="BMI"
                        className="p-3 bg-gray-900 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="date"
                        min={today}
                        value={form.startDate}
                        className="p-3 bg-gray-900 rounded-lg"
                        onChange={(e) =>
                          setForm({ ...form, startDate: e.target.value })
                        }
                      />
                      <input
                        type="date"
                        value={form.endDate}
                        readOnly
                        className="p-3 bg-gray-900 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="number"
                        placeholder="Discount (₹)"
                        value={discount}
                        min="0"
                        className="p-3 bg-gray-900 rounded-lg"
                        onChange={(e) => setDiscount(e.target.value)}
                      />
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="p-3 bg-gray-900 rounded-lg"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="online">Online</option>
                      </select>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-4">
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                        <span>Selected plan</span>
                        <span className="font-semibold text-white">{currentPlan?.name || "None"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Price</span>
                        <span className="font-semibold text-red-500">₹{price.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    <button
                      onClick={handlePayment}
                      className="w-full mt-3 bg-red-600 hover:bg-red-700 py-3 rounded-full font-semibold"
                    >
                      Confirm Payment
                    </button>
                  </div>
                </div>
              </div>

              {/* PLAN SELECTION */}
              <div data-aos="fade-left" className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-black/80 p-6 shadow-xl">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Select Plan</h3>
                      <p className="text-gray-400 text-sm">Search and choose the membership plan you want.</p>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Search by plan name, duration, or price..."
                    value={planSearch}
                    onChange={(e) => setPlanSearch(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white outline-none"
                  />
                </div>

                <div className="grid gap-4">
                  {filteredPlans.length > 0 ? (
                    filteredPlans.map((item, index) => (
                      <button
                        key={item.id || index}
                        onClick={() => setSelectedPlan(item)}
                        className={`rounded-3xl border p-5 text-left transition ${
                          selectedPlan?.id === item.id
                            ? "border-red-500/80 bg-red-500/10"
                            : "border-white/10 bg-black/70 hover:border-red-500/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <h4 className="text-lg font-semibold text-white">{item.name}</h4>
                          <span className="text-sm text-gray-400">{item.duration}</span>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{item.description || item.summary || "Premium membership plan."}</p>
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span>Price</span>
                          <span className="font-semibold text-red-500">₹{Number(item.final_price || item.price || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-white/10 bg-black/70 p-6 text-center text-gray-400">
                      No plans found.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

        </PageContainer>
      </div>
    </>
  );
};

export default BuyPlan;