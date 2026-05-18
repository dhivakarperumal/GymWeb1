import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PricingCard from "./PricingCard";
import api from "../api";
import { useAuth } from "../PrivateRouter/AuthContext";
import { toast } from "react-hot-toast";
import cache from "../cache";

const TODAY = new Date().toISOString().split("T")[0];

const AccountBuyPlan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentType, setPaymentType] = useState("full");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [discount, setDiscount] = useState("");
  const [initialPayment, setInitialPayment] = useState("");
  const [startDate, setStartDate] = useState(TODAY);
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parseDecimal = (value) => {
    if (value == null) return 0;
    const raw = typeof value === "string" ? value.replace(/[^0-9.\-]/g, "") : value;
    const number = Number(raw);
    return Number.isFinite(number) ? number : 0;
  };

  const parseDurationValue = (value) => {
    if (!value) return 0;
    const raw = value.toString().trim().toLowerCase();
    const match = raw.match(/(\d+(?:\.\d+)?)/);
    const amount = match ? Number(match[1]) : NaN;
    if (Number.isNaN(amount)) return 0;
    if (raw.includes("year")) return Math.round(amount * 12);
    if (raw.includes("month")) return Math.round(amount);
    if (raw.includes("week")) return Math.ceil((amount * 7) / 30);
    if (raw.includes("day")) return Math.ceil(amount / 30);
    return Math.round(amount);
  };

  const planPrice = useMemo(
    () => parseDecimal(selectedPlan?.final_price ?? selectedPlan?.finalPrice ?? selectedPlan?.price),
    [selectedPlan]
  );

  const planDurationMonths = useMemo(
    () => parseDurationValue(selectedPlan?.duration),
    [selectedPlan]
  );

  const totalPrice = useMemo(
    () => Math.max(0, planPrice - parseDecimal(discount)),
    [planPrice, discount]
  );

  const emiAmount = useMemo(
    () => (planDurationMonths > 1 ? Number((totalPrice / planDurationMonths).toFixed(2)) : 0),
    [totalPrice, planDurationMonths]
  );

  const isEmiAllowed = planDurationMonths > 1;

  const calculateEndDate = (date, months) => {
    const start = new Date(date);
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) return TODAY;
    const end = new Date(start);
    end.setDate(start.getDate() + months * 30);
    return end.toISOString().split("T")[0];
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        if (cache.plans) {
          setPlans(cache.plans);
          setLoading(false);
        }

        const response = await api.get("/plans");
        const fetchedPlans = Array.isArray(response.data) ? response.data : [];
        setPlans(fetchedPlans);
        cache.plans = fetchedPlans;
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        toast.error("Unable to load plans. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    if (!selectedPlan) {
      setEndDate("");
      return;
    }

    setEndDate(calculateEndDate(startDate, planDurationMonths || 1));
  }, [selectedPlan, startDate, planDurationMonths]);

  useEffect(() => {
    if (paymentType === "emi" && isEmiAllowed && !initialPayment) {
      setInitialPayment(emiAmount.toString());
    }
  }, [paymentType, isEmiAllowed, emiAmount, initialPayment]);

  const handleChoosePlan = (plan) => {
    setSelectedPlan(plan);
    setPaymentType("full");
    setPaymentMode("cash");
    setDiscount("");
    setInitialPayment("");
  };

  const handlePurchase = async () => {
    if (!selectedPlan) {
      toast.error("Please choose a plan first.");
      return;
    }
    if (!user?.id) {
      toast.error("Unable to identify your account.");
      return;
    }

    const amountNow = paymentType === "emi" ? parseDecimal(initialPayment) : totalPrice;
    if (paymentType === "emi" && amountNow <= 0) {
      toast.error("Please enter a valid EMI amount.");
      return;
    }

    const membershipData = {
      userId: user.id,
      userName: user.username || user.full_name || user.name || "",
      userEmail: user.email || "",
      userPhone: user.mobile || user.phone || "",
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      price: totalPrice,
      pricePaid: amountNow,
      secondPaymentPaid: 0,
      duration: selectedPlan.duration,
      startDate,
      endDate,
      paymentMode: paymentType === "emi" ? "emi" : paymentMode,
      paymentStatus:
        paymentType === "emi"
          ? amountNow >= totalPrice
            ? "Paid"
            : amountNow > 0
            ? "Partial"
            : "Pending"
          : "Paid",
      status: "active",
      referredBy: "",
    };

    setSubmitting(true);
    try {
      await api.post("/memberships", membershipData);
      cache.userPlans = null;
      toast.success("Plan purchased successfully.");
      navigate("/account", { state: { tab: "myplans" } });
    } catch (error) {
      console.error("Purchase failed:", error);
      toast.error("Plan purchase failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full py-4 px-2 sm:px-4" data-aos="fade-up">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">Buy Plan</h2>
          <p className="text-gray-400 mt-2 max-w-2xl">
            Select a plan and pay with full or EMI payment options for your account.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-10">Loading plans...</div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`rounded-3xl border p-5 transition ${
                    selectedPlan?.id === plan.id
                      ? "border-red-500/80 bg-red-500/5 shadow-xl"
                      : "border-white/10 bg-black/80 hover:border-red-500/40"
                  }`}
                >
                  <PricingCard
                    service={plan}
                    index={index}
                    hasActivePlan={false}
                    checkingPlan={false}
                    onChoose={() => handleChoosePlan(plan)}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-gray-900/70 p-6 shadow-xl">
                <h3 className="text-xl font-semibold text-white mb-4">Selected Plan</h3>
                {!selectedPlan ? (
                  <p className="text-gray-400">Choose a plan from the left to view purchase details and EMI options.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-black/50 p-4 border border-white/10">
                      <h4 className="text-lg font-bold text-red-500">{selectedPlan.name}</h4>
                      <p className="text-sm text-gray-400 mt-1">{selectedPlan.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-black/50 p-4 border border-white/10">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Duration</p>
                        <p className="font-semibold text-white mt-2">{selectedPlan.duration || "N/A"}</p>
                      </div>
                      <div className="rounded-2xl bg-black/50 p-4 border border-white/10">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Price</p>
                        <p className="font-semibold text-red-500 mt-2">₹{planPrice.toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-gray-300">Discount (optional)</label>
                      <input
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="Enter discount amount"
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none focus:border-red-500"
                        type="number"
                        min="0"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none focus:border-red-500"
                          min={TODAY}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-300">End Date</label>
                        <input
                          type="date"
                          readOnly
                          value={endDate}
                          className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-300">Payment Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: "full", label: "Full Payment" },
                          { value: "emi", label: "EMI" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setPaymentType(option.value)}
                            className={`rounded-2xl py-3 text-sm font-semibold transition ${
                              paymentType === option.value
                                ? "bg-red-600 text-white"
                                : "bg-white/5 text-gray-300 hover:bg-white/10"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {paymentType === "emi" && (
                      <div className="space-y-4 rounded-2xl border border-red-500/20 bg-black/50 p-4">
                        <p className="text-sm text-gray-300">EMI monthly amount</p>
                        <p className="text-3xl font-bold text-red-500">₹{emiAmount.toLocaleString("en-IN")}</p>
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-300">Initial EMI Payment</label>
                          <input
                            type="number"
                            value={initialPayment}
                            min="0"
                            onChange={(e) => setInitialPayment(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none focus:border-red-500"
                            placeholder="Enter amount to pay now"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          EMI is available for plans longer than one month. The remaining balance will be due later.
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <label className="block text-sm font-semibold text-gray-300">Payment Mode</label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-white outline-none focus:border-red-500"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="upi">UPI</option>
                        <option value="online">Online</option>
                      </select>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>Total After Discount</span>
                        <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400 mt-2">
                        <span>Amount to pay now</span>
                        <span>₹{amountNow.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-400 mt-2">
                        <span>Payment status</span>
                        <span className="text-white">
                          {paymentType === "emi"
                            ? amountNow >= totalPrice
                              ? "Paid"
                              : amountNow > 0
                              ? "Partial"
                              : "Pending"
                            : "Paid"}
                        </span>
                      </div>
                    </div>

                    <button
                      disabled={submitting}
                      onClick={handlePurchase}
                      className="w-full rounded-2xl bg-red-600 px-5 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                      {submitting ? "Processing..." : "Purchase Plan"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountBuyPlan;
