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
  const [selectedPlan, setSelectedPlan] = useState(plan || null);
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentType, setPaymentType] = useState("full");
  const [initialPayment, setInitialPayment] = useState("");
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

  const selectedPrice = Number(currentPlan?.final_price || currentPlan?.price || 0);
  const discountValue = parseDecimal(discount);
  const totalPayable = Math.max(0, selectedPrice - discountValue);

  const getDurationMonths = (duration) => {
    if (!duration) return 1;
    const parsed = parseInt(duration, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  };

  const durationMonths = getDurationMonths(currentPlan?.duration);
  const emiAmount = durationMonths > 0 ? Number((totalPayable / durationMonths).toFixed(2)) : totalPayable;
  const isEMIAllowed = durationMonths > 1;
  const amountCollected = Number(parseDecimal(initialPayment));
  const remainingBalance = Math.max(0, totalPayable - amountCollected);
  const dueDateDisplay = (() => {
    try {
      const d = new Date(form.startDate);
      d.setDate(d.getDate() + 30);
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    } catch (e) {
      return "N/A";
    }
  })();
  const amountNow = paymentType === "emi" ? amountCollected : totalPayable;

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

  useEffect(() => {
    if (paymentType !== "emi") return;
    if (!selectedPlan) return;
    if (!initialPayment || parseDecimal(initialPayment) <= 0) {
      setInitialPayment(emiAmount.toString());
    }
  }, [paymentType, selectedPlan, initialPayment, emiAmount]);

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

    const totalPayable = Math.max(0, selectedPrice - discountValue);
    let paymentAmount = totalPayable;
    let secondPaymentPaid = 0;
    let initialPaid = totalPayable;

    if (paymentType === "emi") {
      const initialAmt = parseDecimal(initialPayment);
      if (initialAmt <= 0) {
        alert("Please enter a valid EMI first installment amount.");
        return;
      }
      if (initialAmt > totalPayable) {
        alert("EMI first installment cannot exceed the total payable amount.");
        return;
      }

      paymentAmount = initialAmt;
      initialPaid = initialAmt;
      secondPaymentPaid = Math.max(0, totalPayable - initialAmt);
    }

    const options = {
      key: "rzp_test_2ORD27rb7vGhwj",
      amount: paymentAmount * 100,
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
            pricePaid: initialPaid,
            secondPaymentPaid,
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
                      <select
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="p-3 bg-gray-900 rounded-lg"
                      >
                        <option value="full">Full Payment</option>
                        <option value="emi" disabled={!isEMIAllowed}>
                          EMI{!isEMIAllowed ? " (only for multi-month plans)" : ""}
                        </option>
                      </select>
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

                    {paymentType === "emi" && (
                      <>
                        <div className="rounded-2xl border border-white/10 bg-gray-900/40 p-4 mb-3">
                          <p className="text-sm text-gray-300">EMI monthly amount</p>
                          <p className="text-2xl font-bold text-red-500">₹{emiAmount.toLocaleString("en-IN")}</p>
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-300">Initial EMI Payment</label>
                            <div className="relative mt-2">
                              <span className="absolute left-3 top-3 text-white font-semibold">₹</span>
                              <input
                                type="number"
                                placeholder={`Enter amount to pay now`}
                                value={initialPayment}
                                min="0"
                                className="w-full pl-8 pr-3 py-3 bg-gray-900 rounded-lg"
                                onChange={(e) => setInitialPayment(e.target.value)}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">EMI is available for plans longer than one month. The remaining balance will be due later.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                          <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 p-3 rounded-lg border border-green-500/30">
                            <p className="text-green-400 text-xs uppercase tracking-wide font-semibold">Amount Collected Today</p>
                            <p className="text-white font-bold text-lg mt-1">₹{amountCollected.toFixed(2)}</p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 p-3 rounded-lg border border-blue-500/30">
                            <p className="text-blue-400 text-xs uppercase tracking-wide font-semibold">Remaining Balance</p>
                            <p className="text-white font-bold text-lg mt-1">₹{remainingBalance.toFixed(2)}</p>
                            <p className="text-blue-400 text-xs mt-1">Due in 30 days</p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 p-3 rounded-lg border border-purple-500/30">
                            <p className="text-purple-400 text-xs uppercase tracking-wide font-semibold">Due Date</p>
                            <p className="text-white font-bold text-sm mt-1">{dueDateDisplay}</p>
                          </div>
                        </div>

                        <div className="bg-white/5 p-3 rounded-lg border border-white/10 border-dashed mb-3">
                          <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold mb-2">Payment Summary</p>
                          <div className="flex justify-between text-sm text-gray-300">
                            <span>Step 1: Pay Today</span>
                            <span className="text-green-400">₹{amountCollected.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-300 mt-1">
                            <span>Step 2: Pay in 30 Days</span>
                            <span className="text-blue-400">₹{remainingBalance.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold text-white mt-2 border-t border-white/10 pt-2">
                            <span>Total Amount</span>
                            <span className="text-orange-400">₹{totalPayable.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </>
                    )}

                    <input
                      type="number"
                      placeholder="Discount (₹)"
                      value={discount}
                      min="0"
                      className="p-3 bg-gray-900 rounded-lg"
                      onChange={(e) => setDiscount(e.target.value)}
                    />

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
                      <p className="text-gray-400 text-sm">Choose the plan you want to purchase.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm text-gray-400">Choose Plan</label>
                    <select
                      value={selectedPlan?.id || ""}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const planObject = plans.find((item) => String(item.id) === selectedId);
                        if (planObject) setSelectedPlan(planObject);
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-gray-900/80 px-4 py-3 text-white outline-none"
                    >
                      <option value="" disabled>
                        Select a plan...
                      </option>
                      {plans.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — {item.duration} — ₹{Number(item.final_price || item.price || 0).toLocaleString("en-IN")}
                        </option>
                      ))}
                    </select>

                    {!selectedPlan ? (
                      <div className="rounded-3xl border border-white/10 bg-black/70 p-6 text-center text-gray-400">
                        Select a plan from the dropdown to view details.
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-white/10 bg-black/70 p-6">
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold text-white">{selectedPlan.name}</h4>
                          <p className="text-sm text-gray-400">{selectedPlan.duration}</p>
                        </div>
                        <p className="text-sm text-gray-300 mb-3">{selectedPlan.description || selectedPlan.summary || "Premium membership plan."}</p>
                        <div className="grid gap-3 text-sm text-gray-300">
                          <div className="flex items-center justify-between">
                            <span>Plan Price</span>
                            <span className="font-semibold text-red-500">₹{selectedPrice.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Discount</span>
                            <span>₹{discountValue.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex items-center justify-between font-semibold text-white">
                            <span>Total Payable</span>
                            <span>₹{totalPayable.toLocaleString("en-IN")}</span>
                          </div>
                          {paymentType === "emi" && (
                            <div className="flex items-center justify-between text-sm text-gray-400">
                              <span>Suggested EMI ({durationMonths} installments)</span>
                              <span>₹{emiAmount.toLocaleString("en-IN")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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