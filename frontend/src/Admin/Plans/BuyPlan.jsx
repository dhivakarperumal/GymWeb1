import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import api from "../../api";
import emailjs from "@emailjs/browser";
import jsPDF from "jspdf";
import "jspdf-autotable";
const MEMBERS_API = "/members";
const PLANS_API = "/plans";
const MEMBERSHIP_API = "/memberships";

const BuyPlanadmin = () => {
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [memberHistory, setMemberHistory] = useState([]);

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



  // ================= GENERATE PDF =================
  const generateAndDownloadPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(249, 115, 22); // Orange
    doc.text("GYM MEMBERSHIP RECEIPT", 105, 20, null, null, "center");

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 35);
    doc.text(`Receipt No: REC-${Math.floor(Math.random() * 1000000)}`, 15, 45);

    // Member Info
    doc.setFontSize(14);
    doc.setTextColor(249, 115, 22);
    doc.text("Member Details", 15, 60);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Name: ${selectedUser?.name || selectedUser?.username || "Member"}`, 15, 70);
    doc.text(`Phone: ${form.phone}`, 15, 80);
    doc.text(`Email: ${form.email}`, 15, 90);

    // Plan Info
    const paidNow = paymentType === "emi" && isEMIAllowed ? parseDecimal(initialPayment) : getSelectedPlanTotal();
    const paymentModeLabel = paymentType === "emi" && isEMIAllowed ? "EMI" : form.paymentMode;

    doc.autoTable({
      startY: 100,
      head: [["Description", "Details"]],
      body: [
        ["Plan Name", selectedPlan?.name || "N/A"],
        ["Duration", `${selectedPlan?.duration || "N/A"} Months`],
        ["Start Date", form.startDate],
        ["End Date", form.endDate],
        ["Total Amount", `Rs. ${getSelectedPlanTotal()}`],
        ["Amount Paid", `Rs. ${paidNow}`],
        ["Payment Mode", paymentModeLabel],
        ["Payment Status", paymentType === "emi" && isEMIAllowed ? "Partial Payment" : "Paid"],
      ],
      theme: "grid",
      headStyles: { fillColor: [249, 115, 22] }, // Orange header
    });

    // Footer
    doc.setFontSize(10);
    doc.text("Thank you for joining our gym!", 105, doc.lastAutoTable.finalY + 20, null, null, "center");

    // Download the PDF
    doc.save(`Receipt_${selectedUser?.name || selectedUser?.username || "Member"}.pdf`);

    // Return Data URI for email attachment
    return doc.output('datauristring');
  };

  // ================= EMAIL JS =================
  const sendEmailReceipt = async () => {
    // Always generate and download PDF, even if email is missing
    let pdfDataUri = null;
    try {
      pdfDataUri = generateAndDownloadPDF();
    } catch (e) {
      console.error("Failed to generate PDF", e);
    }

    if (!form.email) {
      console.warn("No email provided, skipping email sending.");
      return;
    }

    const paidNow = paymentType === "emi" && isEMIAllowed ? parseDecimal(initialPayment) : getSelectedPlanTotal();
    const paymentModeLabel = paymentType === "emi" && isEMIAllowed ? "EMI" : form.paymentMode;

    const templateParams = {
      to_name: selectedUser.name || "Member",
      to_email: form.email,
      plan_name: selectedPlan.name,
      duration: selectedPlan.duration,
      start_date: form.startDate,
      end_date: form.endDate,
      amount_paid: paidNow,
      payment_mode: paymentModeLabel,
      total_price: getSelectedPlanTotal(),
      content: pdfDataUri // Attaching the PDF base64 to the email template
    };

    try {
      const response = await emailjs.send(
        'service_gesrr9d',
        'template_3hkcx6m',
        templateParams,
        'e9Nfh3WsTPBxH3bn1'
      );
      console.log('Email sent SUCCESS!', response.status, response.text);
    } catch (error) {
      console.error('Email sent FAILED...', error);
    }
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
        secondPaymentPaid: 0,
        duration: selectedPlan.duration,
        startDate: form.startDate,
        endDate: form.endDate,
        paymentMode: paymentModeValue,
        paymentStatus: isEMI ? "Pending" : "Paid",
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

      // sendWhatsApp();
      await sendEmailReceipt();

      navigate("/admin/members");
    } catch (err) {
      console.error(err);
      alert("Plan save failed");
    }
  };

  return (
    <div className="text-white min-h-screen p-6">
     

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

                // FETCH HISTORY
                if (user) {
                  const uId = user.u_id || user.user_id || user.id;
                  api.get(`/memberships/user/${uId}`)
                    .then(res => setMemberHistory(Array.isArray(res.data) ? res.data : []))
                    .catch(err => console.error("History fetch error:", err));

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
                    // only gym members converted from enquiry should appear
                    if (m.source === "users") return false;

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
            <div className="mb-4 p-6 rounded-2xl bg-gradient-to-br from-orange-900/30 to-orange-900/10 border border-orange-500/50 shadow-lg shadow-orange-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">EMI Payment Plan</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-orange-500/30 transition-all">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Total Plan Price</p>
                  <p className="text-white font-bold text-2xl">₹{getSelectedPlanTotal()}</p>
                  <p className="text-gray-500 text-xs mt-1">{getSelectedPlanDuration()} months duration</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-orange-500/30 transition-all">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Payment Method</p>
                  <p className="text-orange-400 font-bold text-2xl">30-Day Plan</p>
                  <p className="text-gray-500 text-xs mt-1">Pay balance in 30 days</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">1</span>
                  Initial Payment Amount (Today)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-white font-semibold text-lg">₹</span>
                  <input
                    type="number"
                    value={initialPayment}
                    onChange={(e) => setInitialPayment(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-gray-900/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-white/10 hover:border-orange-500/50 transition-all"
                    placeholder="Enter initial payment amount"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Amount to be collected today</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-900/30 to-green-900/10 p-4 rounded-xl border border-green-500/30">
                  <p className="text-green-400 text-xs uppercase tracking-wide font-semibold mb-1">Amount Collected Today</p>
                  <p className="text-white font-bold text-xl">₹{parseDecimal(initialPayment).toFixed(2)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 p-4 rounded-xl border border-blue-500/30">
                  <p className="text-blue-400 text-xs uppercase tracking-wide font-semibold mb-1">Remaining Balance</p>
                  <p className="text-white font-bold text-xl">₹{(getSelectedPlanTotal() - parseDecimal(initialPayment)).toFixed(2)}</p>
                  <p className="text-blue-400 text-xs mt-1">Due in 30 days</p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 p-4 rounded-xl border border-purple-500/30">
                  <p className="text-purple-400 text-xs uppercase tracking-wide font-semibold mb-1">Due Date</p>
                  <p className="text-white font-bold text-lg">
                    {(() => {
                      const dueDate = new Date();
                      dueDate.setDate(dueDate.getDate() + 30);
                      return dueDate.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });
                    })()}
                  </p>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 border-dashed">
                <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold mb-2">📋 Payment Summary</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Step 1: Pay Today</span>
                    <span className="text-green-400 font-semibold">₹{parseDecimal(initialPayment).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Step 2: Pay in 30 Days</span>
                    <span className="text-blue-400 font-semibold">₹{(getSelectedPlanTotal() - parseDecimal(initialPayment)).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-white/10 mt-2 pt-2 flex justify-between items-center text-sm font-bold">
                    <span className="text-white">Total Amount</span>
                    <span className="text-orange-400">₹{getSelectedPlanTotal()}</span>
                  </div>
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
                  {p.name} - {p.duration} - ₹
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

              <p>Duration: {selectedPlan.duration} </p>

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

          {/* MEMBER HISTORY */}
          {selectedUser && (
            <div className="mt-8">
              <h2 className="text-xl mb-4 font-semibold text-orange-400 flex items-center gap-2">
                <span className="w-2 h-6 bg-orange-500 rounded-full"></span>
                Membership History
              </h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {memberHistory.length === 0 ? (
                  <p className="text-gray-500 text-sm italic p-4 bg-white/5 rounded-xl border border-white/5">No previous plan history found.</p>
                ) : (
                  memberHistory.map((h, i) => (
                    <div key={h.id || i} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-white">{h.planName}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${h.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {h.status || 'Past'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400">
                        <div>
                          <p>Price: <span className="text-emerald-400 font-semibold">₹{h.price}</span></p>
                          <p>Paid: ₹{h.pricePaid}</p>
                        </div>
                        <div className="text-right">
                          <p>{new Date(h.startDate).toLocaleDateString()} -</p>
                          <p>{new Date(h.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BuyPlanadmin;