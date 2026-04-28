import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import api from "../../api";

const MEMBERS_API = "/members";
const PLANS_API = "/plans";
const MEMBERSHIP_API = "/memberships";

const BuyPlanadmin = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [trainers, setTrainers] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [sessionTime, setSessionTime] = useState("");
  const [paymentType, setPaymentType] = useState("full");
  const [initialPayment, setInitialPayment] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    phone: "",
    email: "",
    address: "",
    height: "",
    weight: "",
    bmi: "",
    startDate: today,
    endDate: "",
    paymentMode: "cash",
  });

  const normalizePlanText = (text) =>
    text
      ? text.toString().trim().toLowerCase().replace(/\s+/g, " ")
      : "";

  const parseDurationValue = (value) => {
    if (value == null) return null;

    const raw = value.toString().trim().toLowerCase();
    const numberMatch = raw.match(/(\d+(?:\.\d+)?)/);
    const amount = numberMatch ? Number(numberMatch[1]) : NaN;
    if (Number.isNaN(amount)) return null;

    if (raw.includes("year")) return Math.round(amount * 12);
    if (raw.includes("month")) return Math.round(amount);
    if (raw.includes("week")) return Math.ceil((amount * 7) / 30);
    if (raw.includes("day")) return Math.ceil(amount / 30);

    return Number.isFinite(amount) ? Math.round(amount) : null;
  };

  const parseDecimal = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  const getSelectedPlanTotal = () => {
    if (!selectedPlan) return 0;
    return parseDecimal(
      selectedPlan.finalPrice ?? selectedPlan.final_price ?? selectedPlan.price
    );
  };

  const getSelectedPlanDuration = () => {
    if (!selectedPlan) return 1;
    return parseDurationValue(selectedPlan.duration) || 1;
  };

  const getSelectedPlanEMI = () => {
    const total = getSelectedPlanTotal();
    const duration = getSelectedPlanDuration();
    return duration > 0 ? Number((total / duration).toFixed(2)) : 0;
  };

  const isEMIAllowed = selectedPlan ? getSelectedPlanDuration() > 1 : false;

  useEffect(() => {
    if (!selectedPlan) return;
    if (paymentType === "emi" && !initialPayment) {
      setInitialPayment(getSelectedPlanEMI().toString());
    }
  }, [selectedPlan, paymentType]);

  const findPreferredEnquiryPlan = (user, enquiryList) => {
    if (!user || !Array.isArray(enquiryList)) return null;
    const phone = user.phone?.toString().trim();
    const email = user.email?.toString().trim().toLowerCase();
    const candidates = enquiryList
      .filter((q) => {
        const qPhone = q.phone?.toString().trim();
        const qEmail = q.email?.toString().trim().toLowerCase();
        return (phone && qPhone === phone) || (email && qEmail === email);
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const latest = candidates.find((q) => q.plan_name || q.plan_duration);
    return latest ? { plan: latest.plan_name, duration: latest.plan_duration } : null;
  };

  const findMatchingPlan = (user, planList, enquiryList) => {
    if (!user || !Array.isArray(planList)) return null;

    let planName = normalizePlanText(user.plan);
    let durationValue = parseDurationValue(user.duration);

    if (!planName && durationValue == null && Array.isArray(enquiryList)) {
      const fromEnquiry = findPreferredEnquiryPlan(user, enquiryList);
      if (fromEnquiry) {
        planName = normalizePlanText(fromEnquiry.plan);
        durationValue = parseDurationValue(fromEnquiry.duration);
      }
    }

    if (planName) {
      const exactByName = planList.find(
        (p) => normalizePlanText(p.name) === planName
      );
      if (exactByName) return exactByName;

      const partialByName = planList.find((p) => {
        const normalized = normalizePlanText(p.name);
        return normalized.includes(planName) || planName.includes(normalized);
      });
      if (partialByName) return partialByName;
    }

    if (durationValue != null) {
      const exactByDuration = planList.find(
        (p) => parseDurationValue(p.duration) === durationValue
      );
      if (exactByDuration) return exactByDuration;
    }

    return null;
  };

  // ================= FETCH MEMBERS =================
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get(MEMBERS_API);
        setMembers(res.data || []);
      } catch (err) {
        console.error(err);
        alert("Failed to load members");
      }
    };

    fetchMembers();
  }, []);

  // ================= FETCH PLANS =================
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get(PLANS_API);
        setPlans((res.data || []).filter((p) => p.active));
      } catch (err) {
        console.error(err);
        alert("Failed to load plans");
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        const res = await api.get('/enquiries');
        setEnquiries(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchEnquiries();
  }, []);

  useEffect(() => {
    if (!selectedUser || plans.length === 0) return;
    const matchedPlan = findMatchingPlan(selectedUser, plans, enquiries);
    if (matchedPlan && matchedPlan.id !== selectedPlan?.id) {
      setSelectedPlan(matchedPlan);
    }
  }, [selectedUser, plans, enquiries]);

  // ================= FETCH TRAINERS =================
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await api.get("/staff", { params: { role: "trainer" } });
        const data = res.data || [];
        const normalized = Array.isArray(data)
          ? data.map((t) => ({ id: t.id, name: t.name || t.username || "Trainer" }))
          : [];
        setTrainers(normalized);
      } catch (err) {
        console.error(err);
        alert("Failed to load trainers");
      }
    };

    fetchTrainers();
  }, []);

  // ================= CALCULATE BMI =================
  useEffect(() => {
    const h = parseFloat(form.height);
    const w = parseFloat(form.weight);
    if (h > 0 && w > 0) {
      const bmiVal = (w / ((h / 100) * (h / 100))).toFixed(2);
      setForm(prev => ({ ...prev, bmi: bmiVal }));
    }
  }, [form.height, form.weight]);

  // ================= CALCULATE END DATE =================
  useEffect(() => {
    if (!selectedPlan) return;

    const durationMonths = parseDurationValue(selectedPlan.duration) || 0;

    const start = new Date(today);
    const end = new Date(start);

    end.setMonth(start.getMonth() + durationMonths);

    setForm((prev) => ({
      ...prev,
      startDate: today,
      endDate: end.toISOString().split("T")[0],
    }));
  }, [selectedPlan]);

  // ================= AOS =================
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  // ================= WHATSAPP =================
  const sendWhatsApp = () => {
    if (!selectedUser || !selectedPlan) return;

    const phone = selectedUser.phone?.replace(/\D/g, "");

    const paidNow = paymentType === "emi" && isEMIAllowed ? parseDecimal(initialPayment) : getSelectedPlanTotal();
    const paymentModeLabel = paymentType === "emi" && isEMIAllowed ? "EMI" : form.paymentMode;

    const message = `
🏋️ Gym Membership Activated

👤 Name: ${selectedUser.name}
📞 Phone: ${form.phone}

📦 Plan: ${selectedPlan.name}
⏳ Duration: ${selectedPlan.duration} Months

📅 Start Date: ${form.startDate}
📅 End Date: ${form.endDate}

💰 Paid: ₹${paidNow}
💳 Mode: ${paymentModeLabel}

📏 Height: ${form.height}
⚖️ Weight: ${form.weight}
🧮 BMI: ${form.bmi}

✅ Status: Active

Thank you for joining 💪
`;

    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // ================= ASSIGN PLAN =================
  const handleAssignPlan = async () => {
    if (!selectedUser || !selectedPlan) {
      alert("Select member and plan");
      return;
    }

    if (selectedUser.status === "active" && selectedUser.plan) {
      alert("Member already has active plan");
      return;
    }

    try {
      const planTotal = getSelectedPlanTotal();
      const isEMI = paymentType === "emi" && isEMIAllowed;
      const amountNow = isEMI ? parseDecimal(initialPayment) : planTotal;
      const paymentModeValue = isEMI ? "emi" : form.paymentMode;

      // ===== SAVE MEMBERSHIP HISTORY =====
      const membershipData = {
        userId: selectedUser.u_id || selectedUser.user_id || selectedUser.id,
        userName: selectedUser.name || selectedUser.username,
        userEmail: form.email,
        userPhone: form.phone,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        price: planTotal,
        pricePaid: amountNow,
        duration: selectedPlan.duration,
        startDate: form.startDate,
        endDate: form.endDate,
        paymentMode: paymentModeValue,
        status: "active",
      };

      await api.post("/memberships", membershipData);

      // ===== UPDATE MEMBER =====
      const updatedMember = {
        ...selectedUser,
        phone: form.phone,
        email: form.email,
        address: form.address,
        height: form.height,
        weight: form.weight,
        bmi: form.bmi,
        plan: selectedPlan.name,
        duration: selectedPlan.duration,
        joinDate: form.startDate,
        expiryDate: form.endDate,
        status: "active",
      };

      // ===== OPTIONAL ASSIGN TRAINER =====
      if (selectedTrainer) {
        const assignPayload = {
          userId: selectedUser.u_id || selectedUser.id,
          username: selectedUser.username || selectedUser.name || "",
          userEmail: selectedUser.userEmail || selectedUser.email || "",
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          planDuration: selectedPlan.duration,
          planStartDate: form.startDate,
          planEndDate: form.endDate,
          planPrice: selectedPlan.finalPrice ?? selectedPlan.final_price,
          trainerId: selectedTrainer,
          trainerName:
            trainers.find((t) => t.id === selectedTrainer)?.name || "",
          trainerSource: "staff",
          status: "active",
          updatedAt: new Date().toISOString(),
          sessionTime: sessionTime || null,
        };
        await api.post("/assignments", { assignments: [assignPayload] });
      }

      // create or update member with assigned plan
      try {
        if (selectedUser.id) {
          await api.put(`${MEMBERS_API}/${selectedUser.id}`, updatedMember);
        } else {
          // If no gym_member record exists, we create one
          await api.post(MEMBERS_API, updatedMember);
        }
      } catch (error) {
        const errMsg =
          error?.response?.data?.message || error?.message || "Plan assign failed";
        alert(errMsg);
        return;
      }

      alert("Plan assigned successfully");

      sendWhatsApp();

      navigate("/admin/members");
    } catch (err) {
      console.error(err);
      alert("Plan save failed");
    }
  };

  return (
    <div className="text-white min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">Assign Plan</h1>

      <div className="grid md:grid-cols-2 gap-10">

        {/* LEFT FORM */}
        <div className="p-8 rounded-2xl bg-[#1b1b2f] shadow-xl">

          {/* SELECT MEMBER */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Select Member</label>
            <select
              className="w-full p-3 bg-gray-900 rounded-lg border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={selectedUser ? `${selectedUser.source}-${selectedUser.id || selectedUser.u_id}` : ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) {
                  setSelectedUser(null);
                  setSelectedPlan(null);
                  return;
                }
                const [source, idStr] = val.split('-');
                const id = Number(idStr);
                const user = members.find(
                  (m) => m.source === source && (m.id === id || m.u_id === id)
                );

                setSelectedUser(user);

                if (user) {
                  setForm((prev) => ({
                    ...prev,
                    phone: user.phone || "",
                    email: user.email || "",
                    address: user.address || "",
                    height: user.height || "",
                    weight: user.weight || "",
                    bmi: user.bmi || "",
                  }));

                  const matchedPlan = findMatchingPlan(user, plans, enquiries);
                  if (matchedPlan) {
                    setSelectedPlan(matchedPlan);
                    return;
                  }
                }

                setSelectedPlan(null);
              }}
            >
              <option value="">-- Choose a member --</option>

              {(() => {
                const seenPhones = new Set();
                return members
                  .filter((m) => {
                    // 1. Skip if already has active plan
                    const hasPlan = m.status === "active" && m.plan;
                    if (hasPlan) return false;

                    // 2. Skip duplicates by phone
                    if (seenPhones.has(m.phone)) return false;
                    seenPhones.add(m.phone);

                    return true;
                  })
                  .map((m) => {
                    const uniqueKey = `${m.source}-${m.id || m.u_id}`;
                    return (
                      <option key={uniqueKey} value={uniqueKey}>
                        {m.name || "Unknown"} ({m.phone})
                      </option>
                    );
                  });
              })()}
            </select>
          </div>

          {/* PHONE */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
            <input
              className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={form.phone}
              placeholder="Enter phone number"
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />
          </div>

          {/* EMAIL */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Email Address</label>
            <input
              className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={form.email}
              placeholder="Enter email address"
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />
          </div>

          {/* ADDRESS */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Address</label>
            <textarea
              className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={form.address}
              placeholder="Enter full address"
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
            />
          </div>

          {/* HEIGHT WEIGHT BMI */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Height (cm)</label>
              <input
                className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. 175"
                value={form.height}
                onChange={(e) =>
                  setForm({ ...form, height: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Weight (kg)</label>
              <input
                className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g. 70"
                value={form.weight}
                onChange={(e) =>
                  setForm({ ...form, weight: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">BMI</label>
              <input
                className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Auto-calculated"
                value={form.bmi}
                onChange={(e) =>
                  setForm({ ...form, bmi: e.target.value })
                }
              />
            </div>
          </div>

          {/* DATES */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                readOnly
                className="w-full p-3 bg-gray-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                readOnly
                className="w-full p-3 bg-gray-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* PAYMENT TYPE */}
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Payment Type</label>
            <select
              className="w-full p-3 bg-gray-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
            >
              <option value="full">Full Payment</option>
              <option value="emi" disabled={!isEMIAllowed}>
                EMI
              </option>
            </select>
            {selectedPlan && !isEMIAllowed && (
              <p className="mt-2 text-xs text-red-400">
                EMI is available only for plans longer than 1 month.
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Payment Mode</label>
            <select
              className="w-full p-3 bg-gray-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={form.paymentMode}
              onChange={(e) =>
                setForm({ ...form, paymentMode: e.target.value })
              }
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          {selectedPlan && paymentType === "emi" && isEMIAllowed && (
            <div className="mb-4 p-4 rounded-lg bg-gray-900 border border-orange-500">
              <h3 className="text-lg font-semibold text-white mb-4">EMI Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-300 text-sm">Total Plan Price</p>
                  <p className="text-white font-semibold">₹{getSelectedPlanTotal()}</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Plan Duration</p>
                  <p className="text-white font-semibold">{getSelectedPlanDuration()} months</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Monthly EMI Amount</p>
                  <p className="text-white font-semibold">₹{getSelectedPlanEMI()}</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Total EMIs</p>
                  <p className="text-white font-semibold">{getSelectedPlanDuration()}</p>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Initial Payment Amount</label>
                <input
                  type="number"
                  value={initialPayment}
                  onChange={(e) => setInitialPayment(e.target.value)}
                  className="w-full p-3 bg-gray-900 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter initial payment"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-300 text-sm">Amount Collected Now</p>
                  <p className="text-white font-semibold">₹{parseDecimal(initialPayment).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Remaining Balance</p>
                  <p className="text-white font-semibold">₹{(
                    getSelectedPlanTotal() - parseDecimal(initialPayment)
                  ).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Remaining EMIs</p>
                  <p className="text-white font-semibold">{(() => {
                    const remaining = getSelectedPlanTotal() - parseDecimal(initialPayment);
                    const emi = getSelectedPlanEMI();
                    return emi > 0 ? Math.ceil(remaining / emi) : 0;
                  })()}</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Next EMI Amount (Suggested)</p>
                  <p className="text-white font-semibold">₹{(() => {
                    const remaining = getSelectedPlanTotal() - parseDecimal(initialPayment);
                    const emi = getSelectedPlanEMI();
                    return remaining > 0 ? Math.min(emi, remaining).toFixed(2) : '0.00';
                  })()}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleAssignPlan}
            className="mt-5 w-full py-3 bg-orange-500 rounded-lg hover:bg-orange-600"
          >
            Assign Plan ₹
            {selectedPlan ? (paymentType === "emi" && isEMIAllowed ? parseDecimal(initialPayment) : getSelectedPlanTotal()) : 0}
          </button>
        </div>

        {/* RIGHT PLAN SELECT */}
        <div className="p-8 rounded-2xl bg-[#1b1b2f] shadow-xl">

          <h2 className="text-xl mb-4 font-semibold text-white">Select Plan</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">Gym Plan</label>
            <select
              className="w-full p-3 bg-gray-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={selectedPlan ? selectedPlan.id : ""}
              onChange={(e) => {
                const plan = plans.find(
                  (p) => p.id === Number(e.target.value)
                );
                setSelectedPlan(plan);
              }}
            >
              <option value="">-- Choose a plan --</option>

              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.duration} months - ₹
                  {p.finalPrice ?? p.final_price}
                </option>
              ))}
            </select>
          </div>

          {selectedPlan && (
            <div className="p-4 border border-red-400 rounded-lg">
              <h3 className="font-bold text-lg">
                {selectedPlan.name}
              </h3>

              <p>Duration: {selectedPlan.duration} months</p>

              <p>
                Price ₹
                {selectedPlan.finalPrice ??
                  selectedPlan.final_price}
              </p>

              <p className="text-gray-300 text-sm mt-2">
                {selectedPlan.description}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BuyPlanadmin;